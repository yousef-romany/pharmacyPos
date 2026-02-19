import re

def fix_strapi_json(input_file, output_file):
    """
    Reads a SQL dump file and fixes malformed JSON in `admin_permissions` inserts.
    Specifically, it replaces backticks (`) with double quotes (") inside JSON strings.
    """
    
    count_fixed = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f_in, open(output_file, 'w', encoding='utf-8') as f_out:
            for line in f_in:
                if line.startswith("INSERT INTO `admin_permissions`"):
                    def replace_backticks(match):
                        content = match.group(0)
                        fixed_content = content.replace("`", '"')
                        return fixed_content

                    new_line = re.sub(r"'(\{.*?\})'", replace_backticks, line)
                    new_line = re.sub(r"'(\[.*?\])'", replace_backticks, new_line)
                    
                    if new_line != line:
                        count_fixed += 1
                    
                    f_out.write(new_line)
                else:
                    f_out.write(line)

        print(f"Processed {input_file}. Fixed {count_fixed} lines.")
        print(f"Output written to {output_file}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    input_path = "/home/yousefx00/Desktop/data.txt"
    output_path = "/home/yousefx00/Desktop/data_fixed.sql"
    fix_strapi_json(input_path, output_path)
