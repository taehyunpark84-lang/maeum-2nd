import { Image, View } from "react-native";
import type { PanelId } from "./types";

const reference = require("../../../assets/council/character-reference.png");
const moderator = require("../../../assets/council/moderator-owl.png");
const columns: Record<PanelId, number> = {
  sadness: 31,
  anxiety: 235,
  anger: 438,
  joy: 642,
};

// Display only each character's exact image area. Reference text/buttons are never rendered.
export function CouncilAvatar({
  id,
  size = 38,
  square = false,
}: {
  id: PanelId | "moderator";
  size?: number;
  square?: boolean;
}) {
  const scale = size / 196;
  return (
    <View
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        borderRadius: square ? 16 : size / 2,
        backgroundColor: "#FFFCF7",
      }}
    >
      {id === "moderator" ? (
        <Image
          source={moderator}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessible={false}
        />
      ) : (
        <Image
          source={reference}
          accessible={false}
          resizeMode="stretch"
          style={{
            position: "absolute",
            width: 857 * scale,
            height: 572 * scale,
            left: -columns[id] * scale,
            top: -148 * scale,
          }}
        />
      )}
    </View>
  );
}
