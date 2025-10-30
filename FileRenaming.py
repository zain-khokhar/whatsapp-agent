import os
import re

base_path = r"C:\Users\KLH\Documents\All-subjects-plan-pdfs\vu-projects-ZOO-pdfs"

# Gather all files and group by code
files_by_code = {}
for filename in os.listdir(base_path):
    if filename.lower().endswith(".pdf"):
        match = re.match(r"^([A-Za-z]{2,4}\d{3})", filename)
        if match:
            code = match.group(1).upper()
            files_by_code.setdefault(code, []).append(filename)

# For each code, sort files and rename as CODE handouts.pdf, CODE handouts_1.pdf, ...
for code, files in files_by_code.items():
    files.sort()  # Sort for consistency
    for i, filename in enumerate(files):
        if i == 0:
            new_name = f"{code} handouts.pdf"
        else:
            new_name = f"{code} handouts_{i}.pdf"
        old_path = os.path.join(base_path, filename)
        new_path = os.path.join(base_path, new_name)
        if old_path != new_path:
            if not os.path.exists(new_path):
                os.rename(old_path, new_path)
                print(f"Renamed: {filename} → {new_name}")
            else:
                print(f"Skipped (target exists): {filename}")
        else:
            print(f"Skipped (same name): {filename}")
