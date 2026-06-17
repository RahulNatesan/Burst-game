import os

def resolve_conflicts_accept_incoming(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if not file.endswith('.tsx') and not file.endswith('.ts'):
                continue
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if '<<<<<<< HEAD' not in content:
                continue
            
            # Resolve by taking the part between ======= and >>>>>>>
            lines = content.splitlines()
            new_lines = []
            in_conflict = False
            keep = False
            
            for line in lines:
                if line.startswith('<<<<<<< HEAD'):
                    in_conflict = True
                    keep = False
                    continue
                elif line.startswith('======='):
                    if in_conflict:
                        keep = True
                        continue
                elif line.startswith('>>>>>>>'):
                    if in_conflict:
                        in_conflict = False
                        keep = False
                        continue
                
                if not in_conflict or keep:
                    new_lines.append(line)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(new_lines) + '\n')
            print(f"Resolved conflict in {path}")

if __name__ == '__main__':
    resolve_conflicts_accept_incoming('e:/Projects/Burst-game/frontend/src')
