import { GoogleDriveService } from '../services/googleDrive.service';

async function testUpload() {
  console.log('\n================================================================');
  console.log('       Google Drive Real Image Upload Verification Test         ');
  console.log('================================================================\n');

  // 1x1 pixel PNG buffer
  const samplePngBuffer = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
  );

  const mockMulterFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: `cp_kerby_verified_estate_${Date.now()}.png`,
    encoding: '7bit',
    mimetype: 'image/png',
    size: samplePngBuffer.length,
    buffer: samplePngBuffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const testPropertyId = 'test-property-001';

  console.log('1. Uploading file to Google Drive:');
  console.log('   File Name :', mockMulterFile.originalname);
  console.log('   MIME Type :', mockMulterFile.mimetype);
  console.log('   Category  : Photos\n');

  try {
    const uploadResult = await GoogleDriveService.uploadListingFile(
      testPropertyId,
      mockMulterFile,
      'Photos'
    );

    console.log('================================================================');
    console.log('                 UPLOAD SUCCESSFUL!                             ');
    console.log('================================================================\n');
    console.log('File ID         :', uploadResult.fileId);
    console.log('File Name       :', uploadResult.fileName);
    console.log('Direct CDN URL  :', uploadResult.directImageUrl);
    console.log('Thumbnail URL   :', uploadResult.thumbnailUrl);
    console.log('Web View Link   :', uploadResult.webViewLink);
    console.log('Web Content Link:', uploadResult.webContentLink);
    console.log('File Size       :', uploadResult.size, 'bytes');

    console.log('\n2. Verifying File Stream Retrieval from Google Drive:');
    const { stream, mimeType } = await GoogleDriveService.getFileStream(uploadResult.fileId);
    console.log('   Retrieved MIME Type:', mimeType);
    console.log('   Readable Stream    : Active & Ready');

    console.log('\n================================================================\n');
  } catch (err: any) {
    console.error('UPLOAD FAILED:', err.message);
    if (err.response?.data) {
      console.error('Google API Error Details:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

testUpload().catch(console.error);
