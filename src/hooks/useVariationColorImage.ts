import { useEffect, useMemo, useState } from "react";
import { collectVarImgs, findIdxByColor } from "@/utils/variationImages";

export function useVariationColorImage({
  variacoes,
  initialColor,
  initialIndex
}: {
  variacoes: any;
  initialColor?: string;
  initialIndex?: number;
}) {
  const imgs = useMemo(() => collectVarImgs(variacoes), [variacoes]);
  const [color, setColor] = useState(initialColor);
  const [idx, setIdx] = useState(initialIndex ?? 0);
  
  useEffect(() => {
    setIdx(findIdxByColor(imgs, color));
  }, [color, imgs.map(i => i.url).join("|")]);
  
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const src = imgs[idx]?.url || imgs[0]?.url || "";
  
  const onError = () => {
    setBroken(b => ({ ...b, [idx]: true }));
    const same = imgs.findIndex((v, i) => i !== idx && !broken[i] && v.color === imgs[idx]?.color);
    setIdx(same >= 0 ? same : imgs.findIndex((_, i) => !broken[i] && i !== idx));
  };
  
  return { imgs, src, color, idx, setColor, setIdx, onError };
}