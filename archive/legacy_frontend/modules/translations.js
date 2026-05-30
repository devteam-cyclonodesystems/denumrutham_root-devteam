/* =====================
   TRANSLATION SYSTEM (EN <-> ML)
   ===================== */
window.MALAYALAM_DICT = {
    "Dashboard": "ഡാഷ്ബോർഡ്",
    "Archana / Pooja Booking": "അർച്ചന / പൂജ ബുക്കിംഗ്",
    "Archana": "അർച്ചന",
    "Hall": "ഹാൾ",
    "Offerings": "വഴിപാട്",
    "Accounts": "കണക്കുകൾ",
    "HR": "ജീവനക്കാർ",
    "Inventory": "ഇൻവെന്ററി",
    "Store": "സ്റ്റോർ",
    "WhatsApp": "വാട്സ്ആപ്പ്",
    "Live": "തത്സമയം",
    "NSS": "എൻ.എസ്.എസ്",
    "Audit Base": "ഓഡിറ്റ്",
    "Automate": "ഓട്ടോമേറ്റ്",
    "Welcome back, Admin": "സ്വാഗതം, അഡ്മിൻ",
    "Total Bookings": "ആകെ ബുക്കിംഗ്",
    "Confirmed": "സ്ഥിരീകരിച്ചവ",
    "Pending": "തീരുമാനിക്കാത്തവ",
    "Revenue": "ആകെ വരുമാനം",
    "Archana List": "അർച്ചന പട്ടിക",
    "Bookings List": "ബുക്കിംഗ് പട്ടിക",
    "New Booking": "പുതിയ ബുക്കിംഗ്",
    "Devotee": "ഭക്തൻ",
    "Nakshatra": "നക്ഷത്രം",
    "Archanas": "അർച്ചനകൾ",
    "Date": "തീയതി",
    "Total": "ആകെ",
    "Status": "സ്ഥിതി",
    "Actions": "പ്രവർത്തനങ്ങൾ",
    "Cancel": "റദ്ദാക്കുക",
    "Edit": "തിരുത്തുക",
    "Approve": "അംഗീകരിക്കുക",
    "Save": "സൂക്ഷിക്കുക",
    "Add": "ചേർക്കുക",
    "Search...": "തിരയുക...",
    "Total Items": "ആകെ ഇനങ്ങൾ",
    "Low Stock": "കുറഞ്ഞ സ്റ്റോക്ക്",
    "Inventory Value": "ഇൻവെന്ററി മൂല്യം",
    "Suppliers": "വിതരണക്കാർ",
    "All Items": "എല്ലാ ഇനങ്ങളും",
    "Suppliers Management": "വിതരണക്കാരുടെ മാനേജ്മെന്റ്",
    "Add Items": "ഇനങ്ങൾ ചേർക്കുക",
    "Purchase Invoice": "പർച്ചേസ് ഇൻവോയ്സ്",
    "ID": "ഐഡി",
    "Item": "ഇനം",
    "Category": "വിഭാഗം",
    "Qty": "അളവ്",
    "Min": "കുറഞ്ഞത്",
    "Unit ₹": "വില ₹",
    "Value": "മൂല്യം",
    "Supplier": "വിതരണക്കാരൻ",
    "Contact": "കണക്റ്റ്",
    "Items Supplied": "വിതരണം ചെയ്ത ഇനങ്ങൾ",
    "Last Delivery": "അവസാന ഡെലിവറി",
    "Price Note": "വില കുറിപ്പ്",
    "Name": "പേര്",
    "Phone": "ഫോൺ",
    "Remarks": "കുറിപ്പുകൾ",
    "Other Remarks": "മറ്റു വിവരങ്ങൾ",
    "Payment Summary": "പേയ്മെന്റ് സംഗ്രഹം",
    "Confirm Booking": "ബുക്കിംഗ് ഉറപ്പാക്കുക",
    "Amount in words": "തുക അക്ഷരങ്ങളിൽ",
    "User consent to receive messages and receipts via WhatsApp.": "വാട്സ്ആപ്പ് വഴി രസീതുകൾ ലഭിക്കാൻ ഉപയോക്താവിന്റെ സമ്മതം."
};

window.App = window.App || {};

App.applyTranslations = function() {
    const ml = App.currentLang === 'ml';
    const dict = window.MALAYALAM_DICT;
    
    // Dynamic text replacement walker
    const walk = (node) => {
        if (node.nodeType === 3) { // Text node
            const text = node.nodeValue.trim();
            if (text) {
                // If switching to ML and translating
                if (ml && dict[text]) {
                    node.nodeValue = node.nodeValue.replace(text, dict[text]);
                    node._originalEn = text; // Store original
                } 
                // If switching back to EN
                else if (!ml && node._originalEn) {
                    node.nodeValue = node.nodeValue.replace(text, node._originalEn);
                }
            }
        } else if (node.nodeType === 1) { // Element node
            if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
                // Translate Placeholders
                if (node.placeholder) {
                    if (ml && dict[node.placeholder]) {
                        node._origPlaceholder = node.placeholder;
                        node.placeholder = dict[node.placeholder];
                    } else if (!ml && node._origPlaceholder) {
                        node.placeholder = node._origPlaceholder;
                    }
                }
                // Translate Tooltips (title / data-tooltip)
                if (node.title) {
                    if (ml && dict[node.title]) {
                        node._origTitle = node.title;
                        node.title = dict[node.title];
                    } else if (!ml && node._origTitle) {
                        node.title = node._origTitle;
                    }
                }
                if (node.dataset && node.dataset.tooltip) {
                    if (ml && dict[node.dataset.tooltip]) {
                        node._origDatasetTooltip = node.dataset.tooltip;
                        node.dataset.tooltip = dict[node.dataset.tooltip];
                    } else if (!ml && node._origDatasetTooltip) {
                        node.dataset.tooltip = node._origDatasetTooltip;
                    }
                }
                node.childNodes.forEach(walk);
            }
        }
    };
    walk(document.getElementById('pageContent'));
    walk(document.getElementById('sidebar'));
    walk(document.getElementById('modalOverlay'));
};
