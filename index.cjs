const express = require('express');
const app = express();
const fetch = require('node-fetch').default;
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true               
}));
app.listen(5000)

const CLIENT_KEY = 'sbawodoricjbym08sg'
const CLIENT_SECRET = 'tN0svNKRi7vHSCx5rk4TFBsRLIkTYo4m'

app.get('/oauth', (req, res) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });
    const SERVER_ENDPOINT_REDIRECT = "https://earmuff-taking-duke.ngrok-free.dev/callback"
    let url = 'https://www.tiktok.com/v2/auth/authorize/';

    // the following params need to be in `application/x-www-form-urlencoded` format.
    url += `?client_key=${CLIENT_KEY}`;
    url += `&scope=user.info.basic`;
    url += `&response_type=code`;
    url += `&redirect_uri=${encodeURIComponent(SERVER_ENDPOINT_REDIRECT)}`;;
    url += `&state=${csrfState}`;

    res.redirect(url);
})


app.get('/callback', async (req, res) => {
    const { code} = req.query;
    console.log(code)
    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
    "Content-Type": "application/x-www-form-urlencoded",
     },

  body: new URLSearchParams({ 
    client_key: CLIENT_KEY, 
    client_secret: CLIENT_SECRET,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: "https://earmuff-taking-duke.ngrok-free.dev/callback"
    }),
    
});
    const json = await response.json()
    console.log(json)
    res.redirect(`https://earmuff-taking-duke.ngrok-free.dev/userInfo?token=${json.access_token}`)
})

app.get('/userInfo', async (req, res) => {
    console.log("BRO")
    const {token} = req.query;
    const response = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name", {
    method: "GET",
    headers: {
    "Authorization": `Bearer ${token}`,
     },

    
});
    const json = await response.json()
    console.log(json.data.user.display_name)
    res.redirect(`http://localhost:5173/userInfo`)
    
})
