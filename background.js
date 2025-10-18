console.log("Copy Helper Firefox background script running");

// Create context menu
browser.runtime.onInstalled.addListener(() => {
  const items = [
    { id: "copyText", title: "Copy Selected Text", contexts: ["selection"] },
    { id: "copyLink", title: "Copy Link URL", contexts: ["link"] },
    { id: "copyTextAndUrlPlain", title: "Copy Text + URL (Plain)", contexts: ["selection","link"] },
    { id: "copyTextAndUrlMarkdown", title: "Copy Text + URL (Markdown)", contexts: ["selection","link"] }
  ];
  items.forEach(item => browser.contextMenus.create(item));
});

// Clipboard + notification
async function copyAndNotify(text, message="Copied!") {
  try {
    await navigator.clipboard.writeText(text);
    browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon128.png"),
      title: "Copy Helper",
      message
    });
  } catch(e){
    console.error("Clipboard write failed:", e);
    browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon128.png"),
      title: "Copy Helper",
      message: "Failed to copy!"
    });
  }
}

// Get selection and link safely
async function getSelectionLink(tabId){
  try {
    const results = await browser.tabs.executeScript(tabId, {
      code: `(() => {
        const sel = window.getSelection();
        const text = sel?.toString()||"";
        const node = sel?.anchorNode?.parentElement;
        const link = node?.closest('a')?.href||null;
        return {text, link};
      })();`
    });
    return results && results[0] ? results[0] : { text:"", link:null };
  } catch(e){
    console.error("getSelectionLink failed:", e);
    return { text:"", link:null };
  }
}

// Context menu
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const { text, link } = await getSelectionLink(tab.id);

  switch(info.menuItemId){
    case "copyText": if(text) await copyAndNotify(text,"Text copied"); break;
    case "copyLink": if(info.linkUrl) await copyAndNotify(info.linkUrl,"Link copied"); break;
    case "copyTextAndUrlPlain": if(text) await copyAndNotify(`${text} - ${link||info.linkUrl||""}`, "Text+URL copied"); break;
    case "copyTextAndUrlMarkdown": if(text) await copyAndNotify(`[${text}](${link||info.linkUrl||""})`, "Text+URL (Markdown) copied"); break;
  }
});