import { ObjectId } from "mongodb";
import { gridFSBucket } from "../database/db.ts";
import { Readable } from "stream";

export async function saveFileToGridFS(buffer: Buffer, filename: string, contentType: string): Promise<ObjectId> {
    
    return new Promise((resolve, reject) => {

        const uploadStream = gridFSBucket.openUploadStream(
            filename, 
            {
                metadata: {
                    contentType
                }
            }
        );

        Readable.from(buffer).pipe(uploadStream).on("error", reject).on("finish", () => {
            resolve(uploadStream.id as ObjectId);
        });
    });
}

export async function getFileFromGridFS(fileId: ObjectId): Promise<{ buffer: Buffer; contentType: string}> {

    return new Promise((resolve, reject) => {

        const chunks: Buffer[] = [];

        const downloadStream = gridFSBucket.openDownloadStream(fileId);

        let contentType = "application/octet-stream";

        downloadStream.on("file", (file) => {

            contentType = 
                (file.metadata?.contentType as string) ??
                "application/octet-stream";
        })

        downloadStream.on("data", (chunk) => {
            chunks.push(chunk);
        });

        downloadStream.on("error", reject);

        downloadStream.on("end", () => {
            
            resolve({
                buffer: Buffer.concat(chunks),
                contentType
            });
        });
    });

}