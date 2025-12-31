export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.setAttribute("crossOrigin", "anonymous");
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(image);
    };
    image.src = src;
  });
};

export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}
