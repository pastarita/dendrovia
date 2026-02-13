#!/usr/bin/env python3
"""
Ghostty Window Grid Layout
Uses Quartz/AppKit to position windows directly
"""

import Quartz
import AppKit
from Foundation import NSMakeRect
import sys
import time

def get_ghostty_windows():
    """Get all Ghostty windows using Quartz window server"""
    window_list = Quartz.CGWindowListCopyWindowInfo(
        Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements,
        Quartz.kCGNullWindowID
    )

    ghostty_windows = []
    for window in window_list:
        owner_name = window.get(Quartz.kCGWindowOwnerName, '')
        window_layer = window.get(Quartz.kCGWindowLayer, -1)
        window_name = window.get(Quartz.kCGWindowName, 'Untitled')

        # Find Ghostty windows (standard windows on layer 0)
        if owner_name.lower() == 'ghostty' and window_layer == 0:
            window_number = window.get(Quartz.kCGWindowNumber)
            bounds = window.get(Quartz.kCGWindowBounds)
            ghostty_windows.append({
                'number': window_number,
                'name': window_name,
                'bounds': bounds,
                'pid': window.get(Quartz.kCGWindowOwnerPID)
            })

    return ghostty_windows

def get_screen_dimensions():
    """Get main screen dimensions"""
    screen = AppKit.NSScreen.mainScreen()
    frame = screen.frame()
    return frame.size.width, frame.size.height

def position_windows_grid(windows, cols=3, rows=2, gap=10, top_margin=60):
    """Position windows in a grid layout"""
    screen_width, screen_height = get_screen_dimensions()

    print(f"Screen dimensions: {screen_width:.0f}x{screen_height:.0f}")
    print(f"Found {len(windows)} Ghostty windows")

    # Calculate usable area
    usable_width = screen_width
    usable_height = screen_height - top_margin

    # Calculate window dimensions
    total_gap_width = gap * (cols - 1)
    total_gap_height = gap * (rows - 1)
    window_width = (usable_width - total_gap_width) / cols
    window_height = (usable_height - total_gap_height) / rows

    print(f"Window size: {window_width:.0f}x{window_height:.0f}")

    # Grid positions
    grid_positions = [
        (0, 0),  # CHRONOS
        (0, 1),  # IMAGINARIUM
        (0, 2),  # ARCHITECTUS
        (1, 0),  # LUDUS
        (1, 1),  # OCULUS
        (1, 2),  # OPERATUS
    ]

    # Use accessibility API to move windows
    app = AppKit.NSRunningApplication.runningApplicationsWithBundleIdentifier_(
        'com.mitchellh.ghostty'
    )

    if not app:
        print("❌ Could not find Ghostty application")
        return False

    app = app[0]
    app.activateWithOptions_(AppKit.NSApplicationActivateIgnoringOtherApps)
    time.sleep(0.5)

    # Try to position windows using AppleScript as fallback
    for i, (window, (row, col)) in enumerate(zip(windows[:6], grid_positions)):
        window_x = col * (window_width + gap)
        window_y = top_margin + row * (window_height + gap)

        print(f"Positioning window {i+1} ({window['name']}) at ({window_x:.0f}, {window_y:.0f})")

        # Use osascript to move the window
        script = f'''
tell application "System Events"
    tell process "ghostty"
        try
            set position of window {i+1} to {{{int(window_x)}, {int(window_y)}}}
            set size of window {i+1} to {{{int(window_width)}, {int(window_height)}}}
        on error errMsg
            log "Error moving window {i+1}: " & errMsg
        end try
    end tell
end tell
'''
        import subprocess
        try:
            subprocess.run(['osascript', '-e', script], capture_output=True, timeout=2)
        except Exception as e:
            print(f"  Warning: Could not position window {i+1}: {e}")

    return True

def main():
    windows = get_ghostty_windows()

    if not windows:
        print("No Ghostty windows found")
        return 1

    success = position_windows_grid(windows)

    if success:
        print("\n✅ Window grid layout complete!")
        print("\nGrid layout:")
        print("┌─────────────┬─────────────┬─────────────┐")
        print("│   CHRONOS   │ IMAGINARIUM │ ARCHITECTUS │")
        print("├─────────────┼─────────────┼─────────────┤")
        print("│    LUDUS    │   OCULUS    │  OPERATUS   │")
        print("└─────────────┴─────────────┴─────────────┘")
        return 0
    else:
        return 1

if __name__ == '__main__':
    sys.exit(main())
