import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

const findUploadUrl = (obj: any): string | undefined => {
  try {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findUploadUrl(item);
        if (found) return found;
      }
      return undefined;
    }
    if (!obj || typeof obj !== 'object') return undefined;
    if (typeof obj?.uploadUrl === 'string') return obj.uploadUrl;
    for (const key of Object.keys(obj)) {
      const found = findUploadUrl(obj[key]);
      if (found) return found;
    }
    return undefined;
  } catch (err) {
    console.error('findUploadUrl error:', err);
    return undefined;
  }
};

const findAssetUrn = (obj: any): string | undefined => {
  try {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findAssetUrn(item);
        if (found) return found;
      }
      return undefined;
    }
    if (!obj) return undefined;
    if (typeof obj === 'string' && obj.startsWith('urn:li:digitalmediaAsset:')) return obj;
    if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        const found = findAssetUrn(obj[key]);
        if (found) return found;
      }
    }
    return undefined;
  } catch (err) {
    console.error('findAssetUrn error:', err);
    return undefined;
  }
};

// AUTOMATIC CODE-TO-TOKEN EXCHANGE PROXY
app.post('/api/exchange-token', async (req, res) => {
  const { code, client_id, client_secret } = req.body;
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', 'http://localhost:5173/linkedin/callback');
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: "OAuth Exchange Failed", details: data });
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET ACCOUNT INFORMATION PROXY
app.post('/api/userinfo', async (req, res) => {
  const { token } = req.body;
  try {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REVOKE TOKEN PROXY
app.post('/api/revoke', async (req, res) => {
  const { token, client_id, client_secret } = req.body;
  try {
    const params = new URLSearchParams();
    params.append('token', token);
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);

    const response = await fetch('https://www.linkedin.com/oauth/v2/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    res.status(response.status).json({ success: response.ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POSTING ENGINE PROXY 
app.post('/api/post', upload.single('file'), async (req, res) => {
  const { token, authorUrn, commentary, mediaType } = req.body;
  const file = req.file;

  if (!token || !authorUrn) {
    return res.status(400).json({ error: 'Missing token or authorUrn in request.' });
  }
  const isImage = mediaType === 'IMAGE';
  const isVideo = mediaType === 'VIDEO';

  if ((isImage || isVideo) && !file) {
    return res.status(400).json({ error: 'Missing file upload for image/video post.' });
  }

  if (isImage && file && !file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Uploaded file is not a supported image format.' });
  }

  if (isVideo && file && !file.mimetype.startsWith('video/')) {
    return res.status(400).json({ error: 'Uploaded file is not a supported video format.' });
  }

  try {
    // TEXT POST PIPELINE
    if (mediaType === 'TEXT') {
      const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: commentary },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
        })
      });

      const resText = await postResponse.text();
      let resData;
      try { resData = JSON.parse(resText); } catch { resData = { rawText: resText }; }

      if (!postResponse.ok) {
        return res.status(postResponse.status).json({ step: 'TEXT_POST_FAILED', error: resData });
      }
      return res.status(201).json({ step: 'TEXT_POST_SUCCESS', data: resData });
    }

    // (IMAGE & VIDEO)
    if (!file) return res.status(400).json({ error: 'File binary missing.' });

    // Register the file upload asset
    const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: [mediaType === 'IMAGE' ? 'urn:li:digitalmediaRecipe:feedshare-image' : 'urn:li:digitalmediaRecipe:feedshare-video'],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ],
          supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD']
        }
      })
    });

    const registerText = await registerRes.text();
    let registerData: any;
    try {
      registerData = JSON.parse(registerText);
    } catch {
      registerData = registerText;
    }

    console.log('=== REGISTER UPLOAD RESPONSE ===');
    console.log('Status:', registerRes.status);
    console.log('Raw Text:', registerText);
    console.log('Parsed Data:', registerData);
    console.log('================================');

    if (!registerRes.ok) {
      return res.status(registerRes.status).json({
        step: 'ASSET_REGISTRATION_FAILED',
        message: 'LinkedIn asset registration failed.',
        status: registerRes.status,
        registerText,
        registerData
      });
    }

    const uploadUrl = findUploadUrl(registerData);
    const assetUrn = findAssetUrn(registerData);

    console.log('Resolved uploadUrl:', uploadUrl);
    console.log('Resolved assetUrn:', assetUrn);

    if (!uploadUrl || !assetUrn) {
      console.error('FAILED TO RESOLVE - Full registerData:', JSON.stringify(registerData, null, 2));
      return res.status(500).json({
        step: 'UPLOAD_RESOLVE_FAILED',
        message: 'Unable to resolve uploadUrl or asset URN. Check backend logs.',
        uploadUrl,
        assetUrn,
        registerData
      });
    }

    // uploadUrl must be a valid string
    if (typeof uploadUrl !== 'string' || !uploadUrl.startsWith('http')) {
      console.error('INVALID UPLOAD URL:', { uploadUrl, type: typeof uploadUrl });
      return res.status(500).json({
        step: 'UPLOAD_URL_INVALID',
        message: 'uploadUrl is not a valid HTTP URL',
        uploadUrl,
        uploadUrlType: typeof uploadUrl
      });
    }

    console.log('Proceeding with upload to:', uploadUrl);

    //Direct Binary Data Upload Stream
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.mimetype },
      body: file.buffer as any
    });

    const uploadText = await uploadRes.text();
    let uploadData: any;
    try {
      uploadData = JSON.parse(uploadText);
    } catch {
      uploadData = uploadText;
    }

    if (!uploadRes.ok) {
      return res.status(uploadRes.status).json({
        step: 'BINARY_UPLOAD_FAILED',
        message: 'Binary upload to LinkedIn failed.',
        uploadText,
        uploadData
      });
    }

    // Deploy Content Post with attached media
    const finalPostRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: commentary },
            shareMediaCategory: mediaType === 'IMAGE' ? 'IMAGE' : 'VIDEO',
            media: [{
              status: 'READY',
              description: { text: commentary },
              media: assetUrn,
              title: { text: mediaType === 'IMAGE' ? 'Image Upload' : 'Video Upload' }
            }]
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });

    const finalText = await finalPostRes.text();
    let finalData: any;
    try {
      finalData = JSON.parse(finalText);
    } catch {
      finalData = finalText;
    }

    if (!finalPostRes.ok) {
      return res.status(finalPostRes.status).json({
        step: 'MEDIA_POST_FAILED',
        message: 'LinkedIn media post creation failed.',
        finalText,
        finalData
      });
    }

    res.status(201).json({ step: 'COMPLETE_SUCCESS', assetUrn, data: finalData });

  } catch (err: any) {
    console.error('Unhandled /api/post error:', err);
    res.status(500).json({
      error: err?.message || String(err),
      stack: err?.stack || undefined
    });
  }
});

app.listen(3001, () => console.log('🚀 API Proxy Running on http://localhost:3001'));