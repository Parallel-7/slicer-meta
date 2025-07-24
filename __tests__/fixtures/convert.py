#!/usr/bin/env python3
"""
Post-processing script for OrcaSlicer to convert G-code format to match Orca-FlashForge
This ensures proper ETA display on FlashForge printers and API compatibility

Usage: Add this script to OrcaSlicer's post-processing scripts
The script will automatically restructure the G-code file format
"""

import sys
import os
import re
from typing import List, Tuple

def extract_sections(gcode_content: str) -> Tuple[str, str, str, str, str]:
    """
    Extract different sections from the G-code file
    Returns: (header_block, thumbnail_block, executable_gcode, metadata, config_block)
    """
    
    lines = gcode_content.split('\n')
    
    header_block = []
    thumbnail_block = []
    config_block = []
    metadata = []
    executable_gcode = []
    
    current_section = "unknown"
    in_thumbnail = False
    executable_started = False
    executable_ended = False
    
    for line in lines:
        line_stripped = line.strip()
        
        # Detect section boundaries
        if line_stripped == "; HEADER_BLOCK_START":
            current_section = "header"
            header_block.append(line)
            continue
        elif line_stripped == "; HEADER_BLOCK_END":
            header_block.append(line)
            current_section = "unknown"
            continue
        elif line_stripped == "; CONFIG_BLOCK_START":
            current_section = "config"
            config_block.append(line)
            continue
        elif line_stripped == "; CONFIG_BLOCK_END":
            config_block.append(line)
            current_section = "unknown"
            continue
        elif line_stripped == "; THUMBNAIL_BLOCK_START":
            in_thumbnail = True
            thumbnail_block.append(line)
            continue
        elif "thumbnail begin" in line_stripped:
            in_thumbnail = True
            thumbnail_block.append(line)
            continue
        elif "thumbnail end" in line_stripped:
            in_thumbnail = False
            thumbnail_block.append(line)
            continue
        elif line_stripped == "; EXECUTABLE_BLOCK_END":
            executable_ended = True
            current_section = "metadata"
            continue
        
        # Route lines to appropriate sections
        if current_section == "header":
            header_block.append(line)
        elif current_section == "config":
            config_block.append(line)
        elif in_thumbnail:
            thumbnail_block.append(line)
        elif executable_ended and current_section == "metadata":
            # This is the metadata that comes after EXECUTABLE_BLOCK_END
            if line_stripped.startswith(';') and ('=' in line or 'filament used' in line or 'estimated' in line or 'total' in line):
                metadata.append(line)
        elif not executable_started and not line_stripped.startswith(';') and line_stripped != "":
            # First non-comment, non-empty line starts executable section
            executable_started = True
            executable_gcode.append(line)
        elif executable_started and not executable_ended:
            executable_gcode.append(line)
        elif current_section == "unknown" and not executable_ended:
            # Handle any remaining lines before executable section ends
            if line_stripped.startswith(';') or line_stripped == "":
                # Comments or empty lines go to appropriate section
                if not executable_started:
                    # Before executable section, might be orphaned comments
                    executable_gcode.append(line)
                else:
                    executable_gcode.append(line)
            else:
                executable_gcode.append(line)
    
    return (
        '\n'.join(header_block),
        '\n'.join(thumbnail_block), 
        '\n'.join(executable_gcode),
        '\n'.join(metadata),
        '\n'.join(config_block)
    )

def restructure_gcode(input_file: str) -> str:
    """
    Restructure G-code from OrcaSlicer format to Orca-FlashForge format
    """
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file {input_file}: {e}")
        return None
    
    # Extract sections
    header_block, thumbnail_block, executable_gcode, metadata, config_block = extract_sections(content)
    
    # Build new structure following Orca-FlashForge format:
    # 1. Header block
    # 2. Metadata (filament usage, ETA, etc.)
    # 3. Config block  
    # 4. Thumbnail block
    # 5. Executable G-code
    
    restructured_parts = []
    
    # 1. Header block
    if header_block.strip():
        restructured_parts.append(header_block)
        restructured_parts.append("")  # Empty line for spacing
    
    # 2. Metadata (the crucial part for ETA display)
    if metadata.strip():
        restructured_parts.append(metadata)
        restructured_parts.append("")  # Empty line for spacing
    
    # 3. Config block
    if config_block.strip():
        restructured_parts.append(config_block)
        restructured_parts.append("")  # Empty line for spacing
    
    # 4. Thumbnail block
    if thumbnail_block.strip():
        restructured_parts.append(thumbnail_block)
        restructured_parts.append("")  # Empty line for spacing
    
    # 5. Executable G-code
    if executable_gcode.strip():
        restructured_parts.append(executable_gcode)
    
    return '\n'.join(restructured_parts)

def main():
    """
    Main function for post-processing script
    """
    
    if len(sys.argv) < 2:
        print("Usage: python post_process_orca_flashforge.py <gcode_file>")
        sys.exit(1)
    
    gcode_file = sys.argv[1]
    
    if not os.path.exists(gcode_file):
        print(f"Error: File {gcode_file} does not exist")
        sys.exit(1)
    
    print(f"Converting G-code format: {gcode_file}")
    
    # Create backup
    backup_file = gcode_file + ".backup"
    try:
        with open(gcode_file, 'r', encoding='utf-8') as src:
            with open(backup_file, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
        print(f"Backup created: {backup_file}")
    except Exception as e:
        print(f"Warning: Could not create backup: {e}")
    
    # Restructure the file
    restructured_content = restructure_gcode(gcode_file)
    
    if restructured_content is None:
        print("Error: Failed to restructure G-code")
        sys.exit(1)
    
    # Write the restructured content back to the original file
    try:
        with open(gcode_file, 'w', encoding='utf-8') as f:
            f.write(restructured_content)
        print(f"Successfully converted {gcode_file} to Orca-FlashForge format")
        print("ETA and metadata should now be properly displayed on FlashForge printer and API")
    except Exception as e:
        print(f"Error writing file {gcode_file}: {e}")
        # Try to restore backup
        if os.path.exists(backup_file):
            try:
                with open(backup_file, 'r', encoding='utf-8') as src:
                    with open(gcode_file, 'w', encoding='utf-8') as dst:
                        dst.write(src.read())
                print("Restored original file from backup")
            except:
                print("Failed to restore backup - manual intervention required")
        sys.exit(1)

if __name__ == "__main__":
    main()