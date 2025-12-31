import {
  useRef,
  useEffect,
  createRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

interface MediaProps {
  src: string;
}

const MediaElement: ForwardRefExoticComponent<
  MediaProps & RefAttributes<unknown>
> = forwardRef<unknown, MediaProps>((props, ref) => {
  const { src } = props;
  const mediaRef = createRef<HTMLVideoElement>();
  const initialized = useRef<boolean>(false);

  useImperativeHandle(ref, () => mediaRef.current);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;
    const media = mediaRef.current!;

    media.addEventListener("loadedmetadata", () => {
      console.log("loadedmetadata");
    });
    media.addEventListener("canplaythrough", () => {
      console.log("canplaythrough");
    });
    media.addEventListener("play", () => {
      console.log("play");
    });
    media.addEventListener("pause", () => {
      console.log("pause");
    });
    media.addEventListener("seeking", () => {
      console.log("seeking");
    });
    media.addEventListener("seeked", () => {
      console.log("seeked");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <audio ref={mediaRef} controls src={src} />;
});

export default MediaElement;
