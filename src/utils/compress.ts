/**
 * Utility to read an image file from the local drive,
 * resize it using an HTML5 Canvas, and compress to JPEG format.
 * This yields a very small Base64 string (~10-20KB) which is
 * perfect for storing in the simulated localStorage database.
 */
export const compressAndGetBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Target max dimension for thumbnail/avatar is 300px
        const MAX_DIM = 300; 
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background with white in case of transparency so jpeg doesn't turn black
          ctx.fillStyle = '#121625'; // background color matches modal
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG at 0.75 quality for visual balance and super small size
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
