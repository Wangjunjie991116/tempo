import { render, fireEvent } from "@testing-library/react-native";
import { LogoutDialog } from "../LogoutDialog";

describe("LogoutDialog", () => {
  it("renders when visible", () => {
    const { getByText } = render(
      <LogoutDialog visible onClose={() => {}} onConfirm={() => {}} />
    );
    expect(getByText("Log Out?")).toBeTruthy();
  });

  it("calls onClose when Close pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <LogoutDialog visible onClose={onClose} onConfirm={() => {}} />
    );
    fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onConfirm when Logout pressed", () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <LogoutDialog visible onClose={() => {}} onConfirm={onConfirm} />
    );
    fireEvent.press(getByText("Logout"));
    expect(onConfirm).toHaveBeenCalled();
  });
});
