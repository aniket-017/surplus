from pathlib import Path

path = Path(r"c:\Users\9421309441\Desktop\Projects\surplus\mobile\app\(auth)\sign-in.tsx")
text = path.read_text(encoding="utf-8")
first = text.find("export default function SignInScreen")
second = text.find("export default function SignInScreen", first + 1)
print("first", first, "second", second, "lines", text.count("\n") + 1)
if second != -1:
    # Keep from start through end of first styles block
    # Find the styles closing after first export
    styles_marker = "\nconst styles = StyleSheet.create({"
    styles_pos = text.find(styles_marker, first)
    # Find matching close of StyleSheet - look for "\n});\n" after styles
    end = text.find("\n});\n", styles_pos)
    if end != -1:
        cleaned = text[: end + 5]
        path.write_text(cleaned, encoding="utf-8", newline="\n")
        print("cleaned to", cleaned.count("\n") + 1, "lines")
    else:
        print("could not find styles end")
else:
    print("no duplicate")
