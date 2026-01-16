/**
 * INTEGRATION GUIDE: Cart Drawer Version Management
 * 
 * This file contains the exact code snippets you need to add to app/routes/app.cart-drawer.tsx
 * to enable version management with the "Manage Versions" button and modal.
 */

// ========================================
// STEP 1: The import is already added (line 52)
// ========================================
import { VersionManagementModal } from "../components/shared/VersionManagementModal";


// ========================================
// STEP 2: States are already added (lines 898-899)
// ========================================
const [showVersionModal, setShowVersionModal] = useState(false);
const [currentVersion] = useState('default'); // TODO: Get from URL or session


// ========================================
// STEP 3: Add this BUTTON code at line ~1214 (right after the <span>Drag to reorder features</span>)
// ========================================

// FIND THIS (around line 1213):
<span>Drag to reorder features</span>

// REPLACE THE ENTIRE <div> containing the above with this:
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '4px 8px',
  margin: '4px 0 -4px 0',
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: 600
  }}>
    <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.7 }}>
        <circle cx="5" cy="5" r="1.5" />
        <circle cx="10" cy="5" r="1.5" />
        <circle cx="15" cy="5" r="1.5" />
        <circle cx="5" cy="10" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="15" cy="10" r="1.5" />
      </svg>
    </span>
    <span>Drag to reorder features</span>
  </div>
  
  {/* NEW: Version Management Button */}
  <Button
    onClick={() => setShowVersionModal(true)}
    icon={ChartVerticalIcon}
    size="slim"
  >
    Manage Versions
  </Button>
</div>


// ========================================
// STEP 4: Add this MODAL code at the END of the component, just BEFORE the closing </Page> tag
// Find the very end of the return statement (around line 1347) and add this BEFORE </Page>:
// ========================================

{/* Version Management Modal */ }
<VersionManagementModal
    open={showVersionModal}
    onClose={() => setShowVersionModal(false)}
    currentVersion={currentVersion}
    onVersionSwitch={(versionKey) => {
        // Reload page with version parameter
        window.location.href = `/app/cart-drawer?version=${versionKey}`;
    }}
/>


// ========================================
// That's it! The integration is complete.
// ========================================

/**
 * TESTING STEPS:
 * 
 * 1. Save all files
 * 2. Refresh the browser at /app/cart-drawer
 * 3. You should see a "Manage Versions" button next to "Drag to reorder features"
 * 4. Click it to open the modal
 * 5. You'll see version controls and rollout settings
 * 
 * EXPECTED BEHAVIOR:
 * - Modal opens with version list
 * - Can adjust rollout percentages (0%, 25%, 50%, 100%)
 * - Can create new versions
 * - Can switch between versions for editing
 */
