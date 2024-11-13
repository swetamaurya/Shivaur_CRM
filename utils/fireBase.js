const admin = require('firebase-admin');
const dotenv = require("dotenv")
dotenv.config()
 
 const FIREBASE_SERVICE_ACCOUNT_KEY ={
    "type": "service_account",
    "project_id": "fir-project-8d315",
    "private_key_id": "303b8a0eb0d58bd8342be1e969833563d50a210e",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCygB0MnDFXRhMM\nbHZ2DSd8cGoBdW/ab8GHNe4XlF5/ER9SKRE2BEWJlJBUVm/HGvmWdQZryn427X9I\nHeo6LsMHg3GwvFqAZOPo3diz953ndXIDOR0LwtwMLkpn1osnxv1s6WpKIHd31EZV\nIa8mpHK0HsdN90xZXvVKNJwudnOqPSW3G7/GRmJZgj7+TwgrVvZIOMhdNdRsk/Sq\nWBDDYjc2Sj1GZZFDivuQz1aYifbRCv87OD6LlIaRoWOZNDIEOeZB4p0CFSShrxTi\nCUNDF31LNhanLqKuelzgNKWOHfd8s09hY2YURAFto113fYyN9yaCClBuhZmvG2jt\nLQMdk2LpAgMBAAECggEAFSnqx8+jwKpBS0F3kNWhxIz7ie1nnqmOHj7pr4gFkDad\nKmZOG8PJOYpmIRRtL66QwHhi6NgwZh4l74yvHx4453omj62KuXBniU5MXuzRSbEm\nHHW4GOiN+IUV3gE/rIQDu4G3+s6l+4zX7fNkIJvHhyL4adO+t1XylU1u5coLkA0k\nPmxIk7X0ui3nsgFt05glbulptC8msMqEaURZ/8u8bvJcLG2qMTL9OEuI037hVJYj\nhfMabhMKnF/QJrqqB54dDpWHcMK4hIHrVWkyY1ZqxL76UlkPmnSULXogvPAE692b\nCtNp8fCNdZYKkEE99YMb6R03DCZHk96Hp1Db/fSbVQKBgQC+RtoDZPxtnxHOwz54\nW1yKxR5dZAPhb/dUs035O3Imifm3X+DpbQPLrQdtmgpWnvToPfBlFw+Cnil3Z8i5\n38iuR05IIL8sTh4j8gOZzvc0XmqH+vU4tjN7fnwd9NgUFCqcBUvCMbNkQITP16cQ\niDIxPr26IA1LbdHPqrQMq6IJswKBgQDwJ/H++YZi2chlmmfie9MSHgIusiLBGQPn\nQYE56R1bqxHEriGZnCGRf7XoICVZVfW2IDGN+G4bQ1N9PFHpSn1uKaaSXpn7pXzv\n8wZRBTnWGno2PEXTPJbq+mSFkJ3CbCEy6WdmCLjDA/QaZGCFOPcFkx9skCoDcO9B\nRwYrVxga8wKBgQCI4xf80S34/zMkeLn8hF2zR9Rsg4N3L8HToZs67lVU/HY2Qjfg\nNplAch6h7uv5HSo72jOTxl9WLMrQKE3zytbo6kubAFQIX7q3SWjlwkt91V72rMi2\nH/4xnfFU68x3xXpR/E1gS7kvKmthy1dZQWI6o1SDDoQB++OxbrFRXDiamQKBgFfV\nNDOdzSGgJyPJ2g7CXMr2gLPVYNKgtIXCtmGYua0KHwCA8zb8HGbbf4s7Ho3S23/V\nvGoBHzwHXqSiCA87uC4vO4Wy5bxcpRoZFwlQ0PtWSbZGSv9b3JJqK5OR9bDi3S2C\nodd2fySL8J4qcganc+jtCwQoocUKa+bC9CWrv9wzAoGBAIolYMKaeAj+IZMMXRy6\nh1oDwtHLiVuCJH+ACvdZJulbYJYFsmHG7aP9j52SI8CLENXewIhgxJrAxuW4QZhN\nwJ6hquM/aUmTcW1S6zRJTwYHmquuWyVghvNOiwmQT7kw37oWoxlHclKRDPBZsglC\nChnNUsMcFowNsWY+LW5lIy9u\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-nyeoy@fir-project-8d315.iam.gserviceaccount.com",
    "client_id": "114451607466615377994",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-nyeoy%40fir-project-8d315.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }
  
admin.initializeApp({
  credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT_KEY ),
  storageBucket: 'fir-project-8d315.appspot.com' // Specify your bucket name
});

const bucket = admin.storage().bucket();

// Function to upload multiple files to Firebase
// const uploadFileToFirebase = async (files) => {
//   const fileUrls = [];
//   try {
//       for (const file of files) {
//           const docId = Math.floor(Math.random() * 900000000) + 100000000;
//           const fileType = file.originalname.split('.').pop();
//           const fileRef = bucket.file(`${docId}.${fileType}`);
//           const options = {
//               metadata: { contentType: file.mimetype },
//               resumable: false,
//           };

//           await new Promise((resolve, reject) => {
//               const writable = fileRef.createWriteStream(options);

//               writable.on('finish', async () => {
//                   try {
//                       const [fileUrl] = await fileRef.getSignedUrl({
//                           action: 'read',
//                           expires: '03-09-2491',
//                       });
//                       fileUrls.push(fileUrl);
//                       resolve();
//                   } catch (error) {
//                       reject(error);
//                   }
//               });

//               writable.on('error', (error) => {
//                   reject(error);
//               });

//               writable.end(file.buffer);
//           });
//       }
//       return fileUrls;
//   } catch (error) {
//       throw new Error(`Error uploading files: ${error.message}`);
//   }
// };


// Function to upload files (either single or multiple) to Firebase
const uploadFileToFirebase = async (files) => {
    const fileUrls = [];
  
    // Ensure files is an array to handle both single and multiple uploads
    files = Array.isArray(files) ? files : [files]; // Wrap in array if it's a single file object
  
    try {
        for (const file of files) {
            const docId = Math.floor(Math.random() * 900000000) + 100000000;
            const fileType = file.originalname.split('.').pop();
            const fileRef = bucket.file(`${docId}.${fileType}`);
            const options = {
                metadata: { contentType: file.mimetype },
                resumable: false,
            };
  
            await new Promise((resolve, reject) => {
                const writable = fileRef.createWriteStream(options);
  
                writable.on('finish', async () => {
                    try {
                        const [fileUrl] = await fileRef.getSignedUrl({
                            action: 'read',
                            expires: '03-09-2491',
                        });
                        fileUrls.push(fileUrl);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
  
                writable.on('error', (error) => {
                    reject(error);
                });
  
                writable.end(file.buffer);
            });
        }
        return fileUrls;
    } catch (error) {
        throw new Error(`Error uploading files: ${error.message}`);
    }
  };
  
module.exports = { uploadFileToFirebase , bucket};