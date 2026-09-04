/* =========================================================
   THE PICTURE PARLOUR
   Mobile-first photo upload + gallery interaction.

   Photos:
   - are resized/compressed in the browser
   - are uploaded to Google Drive through Apps Script
   - appear immediately in the gallery for this page session
   - can be tapped to open larger in a lightbox
   ========================================================= */

const DRIVE_UPLOAD_URL =
  'https://script.google.com/macros/s/AKfycbxClyEV5G7pue1xklsnVGQtyXlA3t-2hLqmdOelRdUrFh15v5mO1cdoF_xf_GUVVfam0Q/exec';

(() => {
  const camera = document.getElementById('art-camera');
  const cameraHotspot = document.querySelector('.hotspot-camera');

  if (!camera || !cameraHotspot) return;

  /* =========================================================
     CURRENT-SESSION PHOTOS
     ========================================================= */

  const selectedPhotos = [];
  const objectUrls = [];

  /* =========================================================
     CREATE PICTURE PARLOUR
     ========================================================= */

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
      >
        Close
      </button>

      <p
        class="picture-parlour-status"
        aria-live="polite"
      ></p>

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

  /* =========================================================
     CREATE GALLERY
     ========================================================= */

  const gallery = document.createElement('dialog');

  gallery.id = 'pictureGalleryDialog';
  gallery.className = 'picture-gallery-dialog';

  gallery.innerHTML = `
    <div class="picture-gallery-shell">

      <button
        type="button"
        class="picture-gallery-close"
        aria-label="Close gallery"
      >
        Close
      </button>

      <h2 class="picture-gallery-title">
        The Picture Parlour
      </h2>

     <p class="picture-gallery-subtitle">
  Caught beneath the carnival lights.
</p>

<p class="picture-gallery-instruction">
  Tap each picture to expand.
</p>

      <div
  class="picture-gallery-grid"
  aria-live="polite"
></div>

<button
  type="button"
  class="picture-gallery-more"
  hidden
>
  Load More Photos
</button>

<button
  type="button"
  class="picture-gallery-add"
>
  Upload Photos
</button>

    </div>
  `;

  document.body.appendChild(gallery);

  /* =========================================================
     CREATE LARGE-PHOTO LIGHTBOX
     ========================================================= */

  const lightbox = document.createElement('dialog');

  lightbox.className = 'picture-lightbox';
  lightbox.hidden = true;

  lightbox.innerHTML = `
    <button
      type="button"
      class="picture-lightbox-close"
      aria-label="Close photo"
    >
      ×
    </button>

    <img
      class="picture-lightbox-image"
      src=""
      alt="Enlarged Midnight Midway photo"
    />
  `;

  document.body.appendChild(lightbox);

  /* =========================================================
     ELEMENT REFERENCES
     ========================================================= */

  const uploadButton =
    parlour.querySelector('.picture-parlour-upload');

  const galleryButton =
    parlour.querySelector('.picture-parlour-gallery');

  const parlourClose =
    parlour.querySelector('.picture-parlour-close');

  const fileInput =
    parlour.querySelector('.picture-parlour-file-input');

  const status =
    parlour.querySelector('.picture-parlour-status');

  const galleryClose =
    gallery.querySelector('.picture-gallery-close');

  const galleryGrid =
  gallery.querySelector('.picture-gallery-grid');

const galleryMore =
  gallery.querySelector('.picture-gallery-more');

const galleryAdd =
  gallery.querySelector('.picture-gallery-add');

  const lightboxImage =
    lightbox.querySelector('.picture-lightbox-image');

  const lightboxClose =
    lightbox.querySelector('.picture-lightbox-close');

  /* =========================================================
     STATUS MESSAGE
     ========================================================= */

  let statusTimer;

  function showStatus(message, duration = 2600) {
    window.clearTimeout(statusTimer);

    status.textContent = message;
    status.classList.add('is-visible');

    statusTimer = window.setTimeout(() => {
      status.classList.remove('is-visible');
    }, duration);
  }

  /* =========================================================
     RENDER GALLERY
     ========================================================= */

 let galleryNextPageToken = '';
let galleryLoading = false;


async function loadDrivePhotos(
  pageToken = ''
) {
  let url =
    DRIVE_UPLOAD_URL +
    '?action=listPhotos';

  if (pageToken) {
    url +=
      '&pageToken=' +
      encodeURIComponent(
        pageToken
      );
  }

  url +=
    '&cb=' +
    Date.now();

  const response =
    await fetch(
      url,
      {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store'
      }
    );

  const result =
    await response.json();

  if (!result.ok) {
    throw new Error(
      result.error ||
      'Could not load the gallery.'
    );
  }

  return result;
}


async function renderGallery(
  reset = true
) {
  if (galleryLoading) {
    return;
  }

  galleryLoading = true;

  if (reset) {
    galleryNextPageToken = '';

    galleryGrid.innerHTML = '';

    galleryMore.hidden = true;

    const loading =
      document.createElement('p');

    loading.className =
      'picture-gallery-empty';

    loading.textContent =
      'Developing photographs...';

    galleryGrid.appendChild(
      loading
    );

  } else {
    galleryMore.disabled = true;

    galleryMore.textContent =
      'Developing...';
  }

  try {
    const result =
      await loadDrivePhotos(
        galleryNextPageToken
      );

    const photos =
      result.photos || [];

    if (reset) {
      galleryGrid.innerHTML = '';
    }

    if (
      reset &&
      !photos.length
    ) {
      const empty =
        document.createElement('p');

      empty.className =
        'picture-gallery-empty';

      empty.textContent =
        'No photographs have been added yet. Be the first to leave one behind.';

      galleryGrid.appendChild(
        empty
      );

      galleryMore.hidden = true;

      return;
    }

    const tilts = [
      -2.1,
      1.4,
      -0.8,
      2.2,
      -1.5,
      0.7
    ];

    const existingCount =
      galleryGrid.querySelectorAll(
        '.picture-polaroid'
      ).length;

    photos.forEach(
      (photo, index) => {
        const button =
          document.createElement(
            'button'
          );

        button.type =
          'button';

        button.className =
          'picture-polaroid';

        const tiltIndex =
          (
            existingCount +
            index
          ) %
          tilts.length;

        button.style.setProperty(
          '--tilt',
          `${tilts[tiltIndex]}deg`
        );

        button.setAttribute(
          'aria-label',
          `Open photo ${
            existingCount +
            index +
            1
          }`
        );

        const image =
          document.createElement(
            'img'
          );

        image.src =
          photo.thumbUrl;

        image.alt =
          photo.name ||
          'Midnight Midway photo';

        image.loading =
          'lazy';

        button.appendChild(
          image
        );

button.addEventListener(
  'click',
  () => {
    lightboxImage.src =
      photo.fullUrl;

    lightbox.hidden = false;

    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.setAttribute('open', '');
    }
  }
);

        galleryGrid.appendChild(
          button
        );
      }
    );

    galleryNextPageToken =
      result.nextPageToken || '';

    galleryMore.hidden =
      !galleryNextPageToken;

  } catch (error) {
    console.error(
      'Gallery load failed:',
      error
    );

    if (reset) {
      galleryGrid.innerHTML = '';

      const failed =
        document.createElement('p');

      failed.className =
        'picture-gallery-empty';

      failed.textContent =
        'The photographs could not be developed. Please try again.';

      galleryGrid.appendChild(
        failed
      );
    }

  } finally {
    galleryLoading = false;

    galleryMore.disabled = false;

    galleryMore.textContent =
      'Load More Photos';
  }
}

  /* =========================================================
     OPEN / CLOSE PICTURE PARLOUR
     ========================================================= */

  function openParlour() {
    if (typeof parlour.showModal === 'function') {
      parlour.showModal();
    } else {
      parlour.setAttribute('open', '');
    }
  }

  function closeParlour() {
    if (
      typeof parlour.close === 'function' &&
      parlour.open
    ) {
      parlour.close();
    } else {
      parlour.removeAttribute('open');
    }
  }

  /* =========================================================
     OPEN / CLOSE GALLERY
     ========================================================= */

 function openGallery() {
  closeParlour();

  if (
    typeof gallery.showModal ===
    'function'
  ) {
    gallery.showModal();
  } else {
    gallery.setAttribute(
      'open',
      ''
    );
  }

  renderGallery();
}

  function closeGallery() {
    if (
      typeof gallery.close === 'function' &&
      gallery.open
    ) {
      gallery.close();
    } else {
      gallery.removeAttribute('open');
    }
  }

  /* =========================================================
     OPEN / CLOSE LARGE PHOTO
     ========================================================= */

function closeLightbox() {
  if (
    typeof lightbox.close === 'function' &&
    lightbox.open
  ) {
    lightbox.close();
  } else {
    lightbox.removeAttribute('open');
  }

  lightbox.hidden = true;
  lightboxImage.removeAttribute('src');
}

  /* =========================================================
     CAMERA
     ========================================================= */

  cameraHotspot.addEventListener(
    'click',
    event => {
      event.preventDefault();
      event.stopPropagation();

      openParlour();
    }
  );

  /* =========================================================
     PICTURE PARLOUR BUTTONS
     ========================================================= */

  uploadButton.addEventListener(
    'click',
    () => {
      fileInput.click();
    }
  );

  galleryButton.addEventListener(
    'click',
    openGallery
  );

  parlourClose.addEventListener(
    'click',
    closeParlour
  );

  /* =========================================================
     GALLERY BUTTONS
     ========================================================= */

  galleryClose.addEventListener(
    'click',
    closeGallery
  );

galleryMore.addEventListener(
  'click',
  () => {
    renderGallery(false);
  }
);

  galleryAdd.addEventListener(
    'click',
    () => {
      closeGallery();

      openParlour();

      window.setTimeout(() => {
        fileInput.click();
      }, 80);
    }
  );

  /* =========================================================
     FILE → DATA URL
     ========================================================= */

  function readFileAsDataURL(file) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(reader.error);
        };

        reader.readAsDataURL(file);
      }
    );
  }

  /* =========================================================
     LOAD SELECTED PHOTO
     ========================================================= */

  function loadImageFromFile(file) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const image =
            new Image();

          image.onload = () => {
            resolve(image);
          };

          image.onerror = () => {
            reject(
              new Error(
                'This photo could not be read.'
              )
            );
          };

          image.src =
            reader.result;
        };

        reader.onerror = () => {
          reject(reader.error);
        };

        reader.readAsDataURL(file);
      }
    );
  }

  /* =========================================================
     RESIZE + COMPRESS PHOTO BEFORE UPLOAD
     ========================================================= */

  async function preparePhotoForUpload(file) {
    const image =
      await loadImageFromFile(file);

    const MAX_DIMENSION = 2400;

    let width =
      image.naturalWidth;

    let height =
      image.naturalHeight;

    if (
      width > MAX_DIMENSION ||
      height > MAX_DIMENSION
    ) {
      const scale =
        Math.min(
          MAX_DIMENSION / width,
          MAX_DIMENSION / height
        );

      width =
        Math.round(width * scale);

      height =
        Math.round(height * scale);
    }

    const canvas =
      document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext('2d');

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const blob =
      await new Promise(
        (resolve, reject) => {
          canvas.toBlob(
            result => {
              if (result) {
                resolve(result);
              } else {
                reject(
                  new Error(
                    'Could not prepare photo.'
                  )
                );
              }
            },
            'image/jpeg',
            0.88
          );
        }
      );

    const dataURL =
      await readFileAsDataURL(blob);

    const originalBaseName =
      file.name.replace(
        /\.[^.]+$/,
        ''
      ) || 'midway-photo';

    return {
      action: 'uploadPhoto',

      fileName:
        originalBaseName + '.jpg',

      mimeType:
        'image/jpeg',

      base64:
        dataURL.split(',')[1]
    };
  }

  /* =========================================================
     SEND PHOTO TO GOOGLE DRIVE
     ========================================================= */

  async function uploadPhotoToDrive(file) {
    const payload =
      await preparePhotoForUpload(file);

    const response =
      await fetch(
        DRIVE_UPLOAD_URL,
        {
          method: 'POST',

          redirect: 'follow',

          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },

          body:
            JSON.stringify(payload)
        }
      );

    const result =
      await response.json();

    if (!result.ok) {
      throw new Error(
        result.error ||
        'Google Drive upload failed.'
      );
    }

    return result;
  }

  /* =========================================================
     USER SELECTS PHOTOS
     ========================================================= */

  fileInput.addEventListener(
    'change',
    async () => {
      const files =
        Array.from(
          fileInput.files || []
        ).filter(
          file =>
            file.type.startsWith('image/')
        );

      if (!files.length) return;

      uploadButton.disabled = true;
      galleryAdd.disabled = true;

      let successfulUploads = 0;
      let failedUploads = 0;

      for (
        let index = 0;
        index < files.length;
        index++
      ) {
        const file =
          files[index];

        try {
          showStatus(
            `UPLOADING PHOTO ${index + 1} OF ${files.length}...`,
            10000
          );

          /*
             Wait until Google Drive confirms
             that THIS photo was saved.
          */

          await uploadPhotoToDrive(file);

          /*
             Once saved to Drive, also create
             a local URL so it appears instantly
             in this user's gallery.
          */

          const url =
            URL.createObjectURL(file);

          objectUrls.push(url);

          selectedPhotos.push({
            file,
            url
          });

          successfulUploads++;

       } catch (error) {
  console.error(
    'Photo upload failed:',
    error
  );

  failedUploads++;

  window.alert(
    'UPLOAD ERROR:\n\n' +
    (error?.message || String(error))
  );
}
      }
      /* Reset the phone's file picker */

      fileInput.value = '';

      uploadButton.disabled = false;
      galleryAdd.disabled = false;

      /* Refresh gallery data */

      renderGallery();

      /* Tell guest what happened */

      if (
        successfulUploads &&
        !failedUploads
      ) {
        showStatus(
          successfulUploads === 1
            ? 'PHOTO RECEIVED'
            : `${successfulUploads} PHOTOS RECEIVED`,
          3200
        );

      } else if (
        successfulUploads &&
        failedUploads
      ) {
        showStatus(
          `${successfulUploads} SAVED • ${failedUploads} FAILED`,
          4200
        );

      } else {
        showStatus(
          'UPLOAD FAILED. PLEASE TRY AGAIN.',
          4200
        );
      }
    }
  );

  /* =========================================================
     LIGHTBOX CONTROLS
     ========================================================= */

  lightboxClose.addEventListener(
    'click',
    closeLightbox
  );

  /*
     Tap the dark area around the photo
     to close it.
  */

  lightbox.addEventListener(
    'click',
    event => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    }
  );

  /* =========================================================
     TAP OUTSIDE DIALOG TO CLOSE
     ========================================================= */

  parlour.addEventListener(
    'click',
    event => {
      if (event.target === parlour) {
        closeParlour();
      }
    }
  );

  gallery.addEventListener(
    'click',
    event => {
      if (event.target === gallery) {
        closeGallery();
      }
    }
  );

  /* =========================================================
     CLEAN UP TEMPORARY PHOTO URLS
     ========================================================= */

  window.addEventListener(
    'pagehide',
    () => {
      objectUrls.forEach(
        url =>
          URL.revokeObjectURL(url)
      );
    }
  );
})();
