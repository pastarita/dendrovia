#!/usr/bin/osascript
-- Ghostty Window Grid Layout
-- Arranges 6 Ghostty windows in a 3x2 grid on the main display
--
-- Grid layout:
-- ┌─────────────┬─────────────┬─────────────┐
-- │   CHRONOS   │ IMAGINARIUM │ ARCHITECTUS │
-- ├─────────────┼─────────────┼─────────────┤
-- │    LUDUS    │   OCULUS    │  OPERATUS   │
-- └─────────────┴─────────────┴─────────────┘

on run argv
	-- Configuration
	set gridCols to 3
	set gridRows to 2
	set windowGap to 10 -- Gap between windows in pixels
	set topMargin to 60 -- Space for menu bar
	set bottomMargin to 0
	set leftMargin to 0
	set rightMargin to 0

	-- Get screen dimensions (main display)
	tell application "Finder"
		set screenBounds to bounds of window of desktop
		set screenWidth to item 3 of screenBounds
		set screenHeight to item 4 of screenBounds
	end tell

	-- Calculate usable area
	set usableX to leftMargin
	set usableY to topMargin
	set usableWidth to screenWidth - leftMargin - rightMargin
	set usableHeight to screenHeight - topMargin - bottomMargin

	-- Calculate window dimensions (accounting for gaps)
	set totalGapWidth to windowGap * (gridCols - 1)
	set totalGapHeight to windowGap * (gridRows - 1)
	set windowWidth to (usableWidth - totalGapWidth) / gridCols
	set windowHeight to (usableHeight - totalGapHeight) / gridRows

	-- Expected window titles (in order: CHRONOS, IMAGINARIUM, ARCHITECTUS, LUDUS, OCULUS, OPERATUS)
	set pillarOrder to {"CHRONOS", "IMAGINARIUM", "ARCHITECTUS", "LUDUS", "OCULUS", "OPERATUS"}

	-- Grid positions (row, col) for each pillar
	-- Row 0: CHRONOS(0,0), IMAGINARIUM(0,1), ARCHITECTUS(0,2)
	-- Row 1: LUDUS(1,0), OCULUS(1,1), OPERATUS(1,2)
	set gridPositions to {{0, 0}, {0, 1}, {0, 2}, {1, 0}, {1, 1}, {1, 2}}

	tell application "System Events"
		tell process "Ghostty"
			-- Get all windows
			set ghosttyWindows to every window
			set windowCount to count of ghosttyWindows

			if windowCount is 0 then
				log "No Ghostty windows found"
				return
			end if

			log "Found " & windowCount & " Ghostty window(s)"

			-- Position each window according to its pillar
			repeat with i from 1 to windowCount
				if i > 6 then exit repeat -- Only handle first 6 windows

				set currentWindow to item i of ghosttyWindows
				set windowTitle to name of currentWindow

				-- Determine grid position for this window
				set gridPos to item i of gridPositions
				set gridRow to item 1 of gridPos
				set gridCol to item 2 of gridPos

				-- Calculate window bounds
				set windowX to usableX + (gridCol * (windowWidth + windowGap))
				set windowY to usableY + (gridRow * (windowHeight + windowGap))

				-- Set window position and size
				set position of currentWindow to {windowX, windowY}
				set size of currentWindow to {windowWidth, windowHeight}

				log "Positioned window " & i & " (" & windowTitle & ") at (" & windowX & ", " & windowY & ") with size (" & windowWidth & "x" & windowHeight & ")"
			end repeat

			log "✅ Window grid layout complete!"
		end tell
	end tell
end run
