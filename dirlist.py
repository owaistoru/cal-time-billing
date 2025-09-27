import os
import csv

def list_all_and_save(path='.', output_file='directory_list_new_with_Column_head.txt'):
    with open(output_file, 'w', encoding='utf-8') as f:
        for root, dirs, files in os.walk(path):
            f.write(f"📁 Directory: {root}\n")
            for d in dirs:
                f.write(f"  📂 Subfolder: {os.path.join(root, d)}\n")
            for file in files:
                full_path = os.path.join(root, file)
                f.write(f"  📄 File: {full_path}\n")
                if file.endswith('.csv'):
                    try:
                        with open(full_path, 'r', encoding='utf-8') as csvfile:
                            reader = csv.reader(csvfile)
                            headers = next(reader)
                            f.write(f"    Column Headers: {', '.join(headers)}\n")
                    except Exception as e:
                        f.write(f"    Error reading CSV headers: {str(e)}\n")
    print(f"Directory structure saved to {output_file}")

# Run for current directory or change the path
list_all_and_save('.')