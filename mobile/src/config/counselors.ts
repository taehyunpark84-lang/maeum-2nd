export type CounselorId = "sunflower" | "lavender" | "lily";

export const counselors = {
  sunflower: {
    name: "해바라기 상담사",
    image: require("../../assets/counselors/sunflower.jpg"),
  },
  lavender: {
    name: "라벤더 상담사",
    image: require("../../assets/counselors/lavender.jpg"),
  },
  lily: {
    name: "은방울꽃 상담사",
    image: require("../../assets/counselors/lily-of-the-valley.jpg"),
  },
} as const;
