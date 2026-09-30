import fs from 'fs';
import https from 'https';
import path from 'path';

const logoUrl = 'https://clientura.in/wp-content/uploads/2025/09/Clientura-2.png';
const targetPath = path.join(process.cwd(), 'public', 'clientura-logo.png');
const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
const faviconPngPath = path.join(process.cwd(), 'public', 'favicon.png');

console.log('Downloading Clientura logo from:', logoUrl);

https.get(logoUrl, (response) => {
  if (response.statusCode === 200) {
    const fileStream = fs.createWriteStream(targetPath);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log('Successfully saved to:', targetPath);
      // Copy to favicon
      fs.copyFileSync(targetPath, faviconPath);
      fs.copyFileSync(targetPath, faviconPngPath);
      console.log('Successfully updated favicons!');
    });
  } else {
    console.error('Failed to download logo. Status code:', response.statusCode);
  }
}).on('error', (err) => {
  console.error('Error downloading logo:', err.message);
});
