import os

def count_stats(start_path):
    # Extensions to include
    extensions = {'.py', '.js', '.ts', '.tsx', '.css', '.html', '.mjs', '.jsx'}
    # Directories to exclude
    exclude_dirs = {'node_modules', '.git', '.next', '.clerk', 'dist', 'build', '.idea', '.vscode'}
    
    total_lines = 0
    total_words = 0
    total_chars = 0
    
    type_stats = {} # format: ext -> {'lines': 0, 'words': 0, 'chars': 0}

    for root, dirs, files in os.walk(start_path):
        # Modify dirs in-place to exclude unwanted directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in extensions:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                        # Count stats
                        lines = len([line for line in content.splitlines() if line.strip()])
                        words = len(content.split())
                        chars = len(content)
                        
                        # Aggregate totals
                        total_lines += lines
                        total_words += words
                        total_chars += chars
                        
                        # Aggregate by type
                        if ext not in type_stats:
                            type_stats[ext] = {'lines': 0, 'words': 0, 'chars': 0}
                        
                        type_stats[ext]['lines'] += lines
                        type_stats[ext]['words'] += words
                        type_stats[ext]['chars'] += chars
                        
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

    # Formatting output
    print(f"{'Extension':<12} | {'Lines':<10} | {'Words':<12} | {'Characters':<15}")
    print("-" * 56)
    
    for ext, stats in sorted(type_stats.items(), key=lambda x: x[1]['lines'], reverse=True):
        print(f"{ext:<12} | {stats['lines']:<10} | {stats['words']:<12} | {stats['chars']:<15}")
    
    print("-" * 56)
    print(f"{'TOTAL':<12} | {total_lines:<10} | {total_words:<12} | {total_chars:<15}")

if __name__ == "__main__":
    current_dir = os.getcwd()
    print(f"Counting Code Stats in: {current_dir}\n")
    count_stats(current_dir)
