
/* =========================================================
   THE PICTURE PARLOUR
   Front-end interaction only.
   Selected photos appear in the gallery for the current page
   session. Persistent party uploads will be connected later.
   ========================================================= */
const DRIVE_UPLOAD_URL =
  'https://script.google.com/macros/s/AKfycbwZadhWcQTpWbepfbPngKbl10JpbMzLRT77_gD5bbUsG1nkxv5F1qU8JKmemfIiZnk52g/exec';
(() => {
const camera = document.getElementById('art-camera');
const cameraHotspot = document.querySelector('.hotspot-camera');

if (!camera || !cameraHotspot) return;

  const selectedPhotos = [];
  const objectUrls = [];

  const parlour = document.createElement('dialog');
  parlour.id = 'pictureParlourDialog';
  parlour.className = 'picture-parlour-dialog';
  parlour.innerHTML = `
    <div class="picture-parlour-stage">
      <img
        class="picture-parlour-art"
        src="assets/picture-parlour.png"
        alt="The Picture Parlour. Caught beneath the carnival lights."
      />

      <button
        type="button"
        class="picture-parlour-hotspot picture-parlour-upload"
        aria-label="Upload photos"
      ></button>

      <button
        type="button"
        class="picture-parlour-hotspot picture-parlour-gallery"
        aria-label="View gallery"
      ></button>

      <button
        type="button"
        class="picture-parlour-close"
        aria-label="Close The Picture Parlour"
      >Close</button>

      <p class="picture-parlour-status" aria-live="polite"></p>

      <input
        class="picture-parlour-file-input"
        type="file"
        accept="image/*"
        multiple
        hidden
      />
    </div>
  `;
  document.body.appendChild(parlour);

  const gallery = document.createElement('dialog');
  gallery.id = 'pictureGalleryDialog';
  gallery.className = 'picture-gallery-dialog';
  gallery.innerHTML = `
    <div class="picture-gallery-shell">
      <button
        type="button"
        class="picture-gallery-close"
        aria-label="Close gallery"
      >Close</button>

      <h2 class="picture-gallery-title">The Picture Parlour</h2>
      <p class="picture-gallery-subtitle">Caught beneath the carnival lights.</p>

      <div class="picture-gallery-grid" aria-live="polite"></div>

      <button type="button" class="picture-gallery-add">
        Upload Photos
      </button>
    </div>
  `;
  document.body.appendChild(gallery);

  const lightbox = document.createElement('div');
  lightbox.className = 'picture-lightbox';
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <button type="button" class="picture-lightbox-close" aria-label="Close photo">×</button>
    <img alt="Selected party photo" />
  `;
  document.body.appendChild(lightbox);

  const uploadButton = parlour.querySelector('.picture-parlour-upload');
  const galleryButton = parlour.querySelector('.picture-parlour-gallery');
  const parlourClose = parlour.querySelector('.picture-parlour-close');
  const fileInput = parlour.querySelector('.picture-parlour-file-input');
  const status = parlour.querySelector('.picture-parlour-status');

  const galleryClose = gallery.querySelector('.picture-gallery-close');
  const galleryGrid = gallery.querySelector('.picture-gallery-grid');
  const galleryAdd = gallery.querySelector('.picture-gallery-add');

  const lightboxImage = lightbox.querySelector('img');
  const lightboxClose = lightbox.querySelector('.picture-lightbox-close');

  function showStatus(message) {
    status.textContent = message;
    status.classList.add('is-visible');
    window.setTimeout(() => status.classList.remove('is-visible'), 2600);
  }

  function renderGallery() {
    galleryGrid.innerHTML = '';

    if (!selectedPhotos.length) {
      const empty = document.createElement('p');
      empty.className = 'picture-gallery-empty';
      empty.textContent = 'No photographs have been added yet. Be the first to leave one behind.';
      galleryGrid.appendChild(empty);
      return;
    }

    const tilts = [-2.1, 1.4, -0.8, 2.2, -1.5, .7];

    selectedPhotos.forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'picture-polaroid';
      button.style.setProperty('--tilt', `${tilts[index % tilts.length]}deg`);
      button.setAttribute('aria-label', `Open photo ${index + 1}`);

      const image = document.createElement('img');
      image.src = photo.url;
      image.alt = photo.file.name || `Party photo ${index + 1}`;

      button.appendChild(image);
      button.addEventListener('click', () => {
        lightboxImage.src = photo.url;
        lightbox.hidden = false;
      });

      galleryGrid.appendChild(button);
    });
  }

  function openParlour() {
    if (typeof parlour.showModal === 'function') {
      parlour.showModal();
    } else {
      parlour.setAttribute('open', '');
    }
  }

  function closeParlour() {
    if (typeof parlour.close === 'function' && parlour.open) {
      parlour.close();
    } else {
      parlour.removeAttribute('open');
    }
  }

  function openGallery() {
    renderGallery();
    closeParlour();

    if (typeof gallery.showModal === 'function') {
      gallery.showModal();
    } else {
      gallery.setAttribute('open', '');
    }
  }

  function closeGallery() {
    if (typeof gallery.close === 'function' && gallery.open) {
      gallery.close();
    } else {
      gallery.removeAttribute('open');
    }
  }

cameraHotspot.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  openParlour();
});
  uploadButton.addEventListener('click', () => fileInput.click());

  galleryButton.addEventListener('click', openGallery);

  parlourClose.addEventListener('click', closeParlour);

  galleryClose.addEventListener('click', closeGallery);

  galleryAdd.addEventListener('click', () => {
    closeGallery();
    openParlour();
    window.setTimeout(() => fileInput.click(), 80);
  });
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(
        new Error('This photo could not be read.')
      );

      image.src = reader.result;
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function preparePhotoForUpload(file) {
  const image = await loadImageFromFile(file);

  const MAX_DIMENSION = 1800;

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(
      MAX_DIMENSION / width,
      MAX_DIMENSION / height
    );

    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      result => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Could not prepare photo.'));
        }
      },
      'image/jpeg',
      0.84
    );
  });

  const dataURL = await readFileAsDataURL(blob);

  const originalBaseName =
    file.name.replace(/\.[^.]+$/, '') || 'midway-photo';

  return {
    action: 'uploadPhoto',
    fileName: originalBaseName + '.jpg',
    mimeType: 'image/jpeg',
    base64: dataURL.split(',')[1]
  };
}

async function uploadPhotoToDrive(file) {
  const payload = await preparePhotoForUpload(file);

  const response = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(
      result.error || 'Google Drive upload failed.'
    );
  }

  return result;
}
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []).filter(file =>
      file.type.startsWith('image/')
    );

    if (!files.length) return;

    files.forEach(file => {
      const url = URL.createObjectURL(file);
      objectUrls.push(url);
      selectedPhotos.push({ file, url });
    });

    showStatus(
      `${files.length} photo${files.length === 1 ? '' : 's'} added to this preview.`
    );

    fileInput.value = '';
  });

  lightboxClose.addEventListener('click', () => {
    lightbox.hidden = true;
    lightboxImage.removeAttribute('src');
  });

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
      lightbox.hidden = true;
      lightboxImage.removeAttribute('src');
    }
  });

  parlour.addEventListener('click', event => {
    if (event.target === parlour) closeParlour();
  });

  gallery.addEventListener('click', event => {
    if (event.target === gallery) closeGallery();
  });

  window.addEventListener('pagehide', () => {
    objectUrls.forEach(url => URL.revokeObjectURL(url));
  });
})();
