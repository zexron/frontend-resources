/**
 * Author: xuning
 * Date: 2017-12-18.
 */
function imageFix (files) {
  const URL = window.URL || window.webkitURL || window.mozURL
  const MAX_WIDTH = 750
  const MAX_HEIGHT = 1334
  const max = files.length
  const dataURLtoBlob = function (dataurl) {
    let arr = dataurl.split(',')
    let mime = arr[0].match(/:(.*?);/)[1]
    let bstr = atob(arr[1])
    let n = bstr.length
    let u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], {type: mime})
  }
  let promises = []

  for (let i = 0; i < max; i++) {
    let file = files.item(i)
    let reader = new FileReader()
    promises.push(new Promise((resolve, reject) => {
      reader.readAsArrayBuffer(file)
      reader.onload = function (reader, file) {
        return function () {
          const exif = EXIF.readFromBinaryFile(reader.result)
          const mpImg = new MegaPixImage(file)
          const canvas = document.createElement('canvas')
          const img = new Image()
          let width
          let height

          img.src = URL.createObjectURL(file)
          img.onload = function () {
            width = img.width
            height = img.height

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
              if (width / MAX_WIDTH < height / MAX_HEIGHT) {
                width *= MAX_HEIGHT / height
                height = MAX_HEIGHT
              } else {
                height *= MAX_WIDTH / width
                width = MAX_WIDTH
              }
            }

            canvas.width = width
            canvas.height = height

            URL.revokeObjectURL(reader.src)

            mpImg.render(canvas, {width: width, height: height, orientation: exif.Orientation})

            resolve(dataURLtoBlob(canvas.toDataURL('image/jpeg')))
          }

          img.onerror = function () {
            reject('Image Load Error')
          }
        }
      }(reader, file)

      reader.onerror = function () {
        reject('Reader Load Error')
      }
    }))
  }

  return Promise.all(promises)
}
