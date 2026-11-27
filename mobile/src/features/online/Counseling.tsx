import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Button, Copy, Sheet, colors } from "../../components/ui";
import { counselors, type CounselorId } from "../../config/counselors";
import ArtworkImage from "./ArtworkImage";
import type { Artwork } from "../../services/api";

// The teammate's selection/picker UI is retained for future expansion.
// No counselor account, room, message, or application is created in this version.
export default function Counseling({
  artworks,
  imageScope,
  onBack,
}: {
  artworks: Artwork[];
  imageScope: string;
  onBack: () => void;
}) {
  const [selectedCounselor, setSelectedCounselor] =
    useState<CounselorId | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  return (
    <>
      <View style={{ gap: 20 }}>
        <Button
          label="공간으로 돌아가기"
          secondary
          icon="chevron-back"
          onPress={onBack}
        />
        <Copy muted>
          상담 서비스 준비 중 · 담당자와 실제로 연결되지는 않습니다.
        </Copy>
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {(Object.keys(counselors) as CounselorId[]).map((id) => {
            const counselor = counselors[id];
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`${counselor.name} 선택`}
                onPress={() => {
                  setSelectedArtwork(null);
                  setSelectedCounselor(id);
                }}
                style={{ flex: 1, alignItems: "center", gap: 8 }}
              >
                <Image
                  source={counselor.image}
                  contentFit="cover"
                  style={{
                    width: "100%",
                    aspectRatio: 0.9,
                    borderRadius: 24,
                    borderWidth: 3,
                    borderColor: "#242424",
                  }}
                />
                <Text
                  style={{
                    textAlign: "center",
                    color: "#242424",
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {counselor.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {selectedCounselor && (
        <Sheet
          title="프로필로 사용할 작품 선택"
          onClose={() => {
            setSelectedCounselor(null);
            setSelectedArtwork(null);
          }}
          footer={
            <Button
              label="이 작품으로 상담 신청"
              disabled={!selectedArtwork}
              onPress={() =>
                Alert.alert(
                  "상담 서비스 준비 중",
                  "작품 선택 화면을 미리 볼 수 있습니다. 실제 상담 신청과 담당자 연결은 아직 지원하지 않습니다.",
                )
              }
            />
          }
        >
          <Copy muted>
            미리보기용 선택입니다. 작품이 담당자에게 전송되지 않습니다.
          </Copy>
          {!artworks.length && (
            <Copy muted>
              갤러리에 작품이 없습니다. 작품을 만든 뒤 선택 화면을 확인할 수
              있어요.
            </Copy>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {artworks.map((art) => (
              <Pressable
                key={art.id}
                accessibilityRole="button"
                accessibilityLabel={`${art.title} 선택`}
                accessibilityState={{
                  selected: selectedArtwork?.id === art.id,
                }}
                onPress={() => setSelectedArtwork(art)}
                style={{
                  width: "47%",
                  gap: 6,
                  padding: 6,
                  borderRadius: 14,
                  borderWidth: selectedArtwork?.id === art.id ? 3 : 1,
                  borderColor:
                    selectedArtwork?.id === art.id ? colors.green : colors.line,
                }}
              >
                <ArtworkImage
                  id={art.id}
                  scope={imageScope}
                  style={{ width: "100%", aspectRatio: 0.78, borderRadius: 9 }}
                />
                <Text
                  numberOfLines={1}
                  style={{ color: colors.text, fontWeight: "600" }}
                >
                  {art.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </Sheet>
      )}
    </>
  );
}
