import fs from 'fs';

export const deleteFileIfExists = async (filePath) => {
  if (!filePath) return;
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('File delete failed:', err);
      });
    }
  });
};