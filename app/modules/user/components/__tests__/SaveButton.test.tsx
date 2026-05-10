import { render, fireEvent } from "@testing-library/react-native";
import { SaveButton } from "../SaveButton";

describe("SaveButton", () => {
  it("renders title correctly", () => {
    const { getByText } = render(<SaveButton title="Save Changes" onPress={() => {}} />);
    expect(getByText("Save Changes")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<SaveButton title="Save" onPress={onPress} />);
    fireEvent.press(getByText("Save"));
    expect(onPress).toHaveBeenCalled();
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByText } = render(<SaveButton title="Save" disabled onPress={onPress} />);
    fireEvent.press(getByText("Save"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
