import { render, fireEvent } from "@testing-library/react-native";
import { AccountListItem } from "../AccountListItem";

describe("AccountListItem", () => {
  it("renders nav variant with title", () => {
    const { getByText } = render(<AccountListItem variant="nav" title="Settings" />);
    expect(getByText("Settings")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AccountListItem variant="nav" title="Test" onPress={onPress} />
    );
    fireEvent.press(getByText("Test"));
    expect(onPress).toHaveBeenCalled();
  });

  it("renders action variant with custom color", () => {
    const { getByText } = render(
      <AccountListItem variant="action" title="Log Out" textColor="#E53935" />
    );
    expect(getByText("Log Out")).toBeTruthy();
  });
});
