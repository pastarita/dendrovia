#!/usr/bin/osascript
--
-- Ghostty Split Layout Automation
-- Creates 70/30 horizontal split with bottom section split vertically
--
-- Usage: osascript ghostty-split-layout.applescript "Window Title"
--

on run argv
    set windowTitle to item 1 of argv

    tell application "System Events"
        tell process "Ghostty"
            -- Wait for window to be ready
            repeat 20 times
                if exists (window whose name contains windowTitle) then
                    exit repeat
                end if
                delay 0.1
            end repeat

            -- Focus the window
            set frontmost to true
            set targetWindow to window whose name contains windowTitle

            -- Wait a bit for window to be fully initialized
            delay 0.5

            -- Step 1: Create horizontal split (cmd+shift+d)
            keystroke "d" using {command down, shift down}
            delay 0.3

            -- Step 2: Resize to approximately 70/30 (using cmd+option+up multiple times)
            -- Each press resizes by a small increment
            repeat 8 times
                keystroke (ASCII character 30) using {command down, option down} -- Up arrow
                delay 0.1
            end repeat

            delay 0.2

            -- Step 3: Navigate to bottom pane (cmd+])
            keystroke "]" using {command down}
            delay 0.2

            -- Step 4: Split bottom pane vertically (cmd+d)
            keystroke "d" using {command down}
            delay 0.3

            -- Step 5: Navigate back to top pane (cmd+[)
            keystroke "[" using {command down}
            keystroke "[" using {command down}

        end tell
    end tell

    return "Layout configured for: " & windowTitle
end run
