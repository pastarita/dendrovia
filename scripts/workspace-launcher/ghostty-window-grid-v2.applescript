#!/usr/bin/osascript
-- Ghostty Window Grid Layout (v2 - with better window detection)
-- Arranges 6 Ghostty windows in a 3x2 grid

on run argv
	-- Configuration
	set gridCols to 3
	set gridRows to 2
	set windowGap to 10
	set topMargin to 60

	-- Wait for Ghostty to be ready
	delay 2

	-- Activate Ghostty to make sure windows are accessible
	tell application "Ghostty" to activate
	delay 0.5

	-- Get screen dimensions from first available screen
	tell application "Finder"
		set screenBounds to bounds of window of desktop
		set screenWidth to item 3 of screenBounds
		set screenHeight to item 4 of screenBounds
	end tell

	-- Calculate dimensions
	set usableWidth to screenWidth
	set usableHeight to screenHeight - topMargin
	set totalGapWidth to windowGap * (gridCols - 1)
	set totalGapHeight to windowGap * (gridRows - 1)
	set windowWidth to (usableWidth - totalGapWidth) / gridCols
	set windowHeight to (usableHeight - totalGapHeight) / gridRows

	log "Screen: " & screenWidth & "x" & screenHeight
	log "Window size: " & windowWidth & "x" & windowHeight

	-- Grid positions (row, col)
	set gridPositions to {{0, 0}, {0, 1}, {0, 2}, {1, 0}, {1, 1}, {1, 2}}

	tell application "System Events"
		tell application process "ghostty"
			-- Count available windows
			set windowCount to count of windows
			log "Found " & windowCount & " windows"

			if windowCount is 0 then
				log "No windows found - Ghostty may not be accessible"
				return
			end if

			-- Position each window
			repeat with i from 1 to (count of gridPositions)
				if i > windowCount then exit repeat

				set gridPos to item i of gridPositions
				set gridRow to item 1 of gridPos
				set gridCol to item 2 of gridPos

				set windowX to gridCol * (windowWidth + windowGap)
				set windowY to topMargin + gridRow * (windowHeight + windowGap)

				try
					set windowRef to window i
					set windowName to name of windowRef

					log "Window " & i & ": " & windowName & " -> (" & windowX & ", " & windowY & ")"

					set position of windowRef to {windowX, windowY}
					set size of windowRef to {windowWidth, windowHeight}
				on error errMsg
					log "Error with window " & i & ": " & errMsg
				end try
			end repeat

			log "✅ Grid layout complete"
		end tell
	end tell
end run
