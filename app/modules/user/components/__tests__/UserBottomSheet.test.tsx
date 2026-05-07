import { render, fireEvent } from "@testing-library/react-native";
import { UserBottomSheet, BottomSheetItem } from "../UserBottomSheet";

describe("UserBottomSheet", () => {
  it("renders title and children when visible", () => {
    const { getByText } = render(
      <UserBottomSheet visible title="Language" onClose={() => {}}>
        <BottomSheetItem title="English" selected onPress={() => {}} />
      </UserBottomSheet>
    );
    expect(getByText("Language")).toBeTruthy();
    expect(getByText("English")).toBeTruthy();
  });

  it("calls onClose when X pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <UserBottomSheet visible title="Test" onClose={onClose}>
        <BottomSheetItem title="Item" onPress={() => {}} />
      </UserBottomSheet>
    );
    fireEvent.press(getByText("✕"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onPress when item pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BottomSheetItem title="Option" onPress={onPress} />
    );
    fireEvent.press(getByText("Option"));
    expect(onPress).toHaveBeenCalled();
  });
});
