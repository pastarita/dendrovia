#!/usr/bin/osascript -l JavaScript
/**
 * Ghostty Window Grid Layout (JXA version)
 * Uses JavaScript for Automation to position windows
 */

ObjC.import('Cocoa');
ObjC.import('stdlib');

function _run(_argv) {
  // Configuration
  const gridCols = 3;
  const gridRows = 2;
  const windowGap = 10;
  const topMargin = 60;
  const bottomMargin = 0;
  const leftMargin = 0;
  const rightMargin = 0;

  // Get screen dimensions
  const screen = $.NSScreen.mainScreen;
  const screenFrame = screen.frame;
  const screenWidth = screenFrame.size.width;
  const screenHeight = screenFrame.size.height;

  console.log(`Screen dimensions: ${screenWidth}x${screenHeight}`);

  // Calculate usable area
  const usableX = leftMargin;
  const usableY = topMargin;
  const usableWidth = screenWidth - leftMargin - rightMargin;
  const usableHeight = screenHeight - topMargin - bottomMargin;

  // Calculate window dimensions
  const totalGapWidth = windowGap * (gridCols - 1);
  const totalGapHeight = windowGap * (gridRows - 1);
  const windowWidth = (usableWidth - totalGapWidth) / gridCols;
  const windowHeight = (usableHeight - totalGapHeight) / gridRows;

  console.log(`Window size: ${windowWidth}x${windowHeight}`);

  // Get all windows from window server
  const windowList = $.CGWindowListCopyWindowInfo(
    $.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements,
    $.kCGNullWindowID,
  );

  const windowCount = $.CFArrayGetCount(windowList);
  console.log(`Total windows on screen: ${windowCount}`);

  // Find Ghostty windows
  const ghosttyWindows = [];

  for (let i = 0; i < windowCount; i++) {
    const windowInfo = $.CFArrayGetValueAtIndex(windowList, i);
    const ownerName = ObjC.unwrap($.CFDictionaryGetValue(windowInfo, $.kCGWindowOwnerName));
    const windowName = ObjC.unwrap($.CFDictionaryGetValue(windowInfo, $.kCGWindowName));
    const windowLayer = ObjC.unwrap($.CFDictionaryGetValue(windowInfo, $.kCGWindowLayer));

    // Look for Ghostty windows (owner name is "ghostty")
    if (ownerName && ownerName.toLowerCase() === 'ghostty' && windowLayer === 0) {
      const windowNumber = ObjC.unwrap($.CFDictionaryGetValue(windowInfo, $.kCGWindowNumber));
      ghosttyWindows.push({
        number: windowNumber,
        name: windowName || 'Untitled',
        info: windowInfo,
      });
    }
  }

  console.log(`Found ${ghosttyWindows.length} Ghostty windows`);

  if (ghosttyWindows.length === 0) {
    console.log('No Ghostty windows found');
    return;
  }

  // Grid positions for each window
  const gridPositions = [
    [0, 0], // CHRONOS
    [0, 1], // IMAGINARIUM
    [0, 2], // ARCHITECTUS
    [1, 0], // LUDUS
    [1, 1], // OCULUS
    [1, 2], // OPERATUS
  ];

  // Position each window using AXUIElement
  const _systemWide = $.AXUIElementCreateSystemWide();

  for (let i = 0; i < Math.min(ghosttyWindows.length, 6); i++) {
    const win = ghosttyWindows[i];
    const gridPos = gridPositions[i];
    const gridRow = gridPos[0];
    const gridCol = gridPos[1];

    // Calculate window position
    const windowX = usableX + gridCol * (windowWidth + windowGap);
    const windowY = usableY + gridRow * (windowHeight + windowGap);

    console.log(`Positioning window ${i + 1} (${win.name}) at (${Math.round(windowX)}, ${Math.round(windowY)})`);

    // Try to position the window using AXUIElement
    const _windowElement = $.AXUIElementCreateApplication($.getpid());

    // Note: This approach requires finding the window by its window number
    // and using accessibility API, which Ghostty might not fully support

    // Alternative: Use AppleScript bridge
    try {
      const app = Application.currentApplication();
      app.includeStandardAdditions = true;

      // Use osascript to move window via System Events
      app.doShellScript(`osascript -e 'tell application "System Events"
        tell process "ghostty"
          try
            set position of window ${i + 1} to {${Math.round(windowX)}, ${Math.round(windowY)}}
            set size of window ${i + 1} to {${Math.round(windowWidth)}, ${Math.round(windowHeight)}}
          end try
        end tell
      end tell'`);
    } catch (e) {
      console.log(`Could not position window ${i + 1}: ${e}`);
    }
  }

  console.log('✅ Window grid layout complete!');
}
