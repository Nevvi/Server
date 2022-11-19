// @ts-ignore
import Busboy from 'busboy'

export function getFile(event: any) {
    if (event.headers['Content-Type']) {
        event.headers['content-type'] = event.headers['Content-Type']
    }

    const busboy = Busboy({headers: event.headers});
    const result = {
        content: undefined,
        fileName: undefined,
        contentType: undefined
    };

    return new Promise((resolve, reject) => {
        // @ts-ignore
        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            file.on('data', (data: any) => {
                result.content = data;
                console.log("got data... " + data.length + ' bytes');
            });

            file.on('end', () => {
                result.fileName = filename;
                result.contentType = mimetype;
                resolve(result);
            });
        });

        busboy.on('error', (error: any) => reject(error));
        busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
        busboy.end();
    });
}

