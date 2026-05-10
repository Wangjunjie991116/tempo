import { render, fireEvent } from "@testing-library/react-native";
import { FormField } from "../FormField";

describe("FormField", () => {
  it("renders label and value", () => {
    const { getByText, getByDisplayValue } = render(
      <FormField label="Full Name" value="Wade" onChangeText={() => {}} />
    );
    expect(getByText("Full Name")).toBeTruthy();
    expect(getByDisplayValue("Wade")).toBeTruthy();
  });

  it("calls onChangeText when typing", () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <FormField label="Email" value="" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByDisplayValue(""), "test@example.com");
    expect(onChangeText).toHaveBeenCalledWith("test@example.com");
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <FormField label="DOB" value="01/01/2000" onPress={onPress} />
    );
    fireEvent.press(getByText("01/01/2000"));
    expect(onPress).toHaveBeenCalled();
  });
});
