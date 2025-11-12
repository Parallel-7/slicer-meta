# FlashForgeUI Integration Guide: slicer-meta v1.1.0

## 📋 Summary

This document describes changes made to `@parallel-7/slicer-meta` to fix the filament filtering bug and provides integration guidance for FlashForgeUI-Electron.

---

## 🐛 Bugs Fixed

### Bug #1: Incorrect Filament Filtering

**Issue**: Material matching dialog displayed "PLA;PETG;PETG;PETG" (4 materials) for a single-color PLA print.

**Root Cause**: The parser was returning ALL configured filament slots instead of filtering to show only filaments actually used in the print.

**Solution**: Enhanced parser to correlate filament type with usage data and filter out unused filaments.

### Bug #2: Unit Display Bug in FlashForgeUI (CRITICAL)

**Issue**: Job uploader was displaying filament length as "17419.29 mm" when it should display "17.42 m" (meters).

**Root Cause**: FlashForgeUI's `job-uploader-renderer.ts` line 491-499 was displaying filament length in millimeters:

```typescript
// Lines 491-499 in job-uploader-renderer.ts (BUGGY CODE)
if (elements.filamentLen) {
    let lengthText = '-';
    if (data.file?.filamentUsedMM) {
        lengthText = `${data.file.filamentUsedMM.toFixed(2)} mm`;  // ❌ Shows 17419.29 mm
    } else if (data.threeMf?.filaments?.[0]?.usedM) {
        const usedM = parseFloat(data.threeMf.filaments[0].usedM);
        lengthText = `${usedM.toFixed(2)} mm`;  // ❌ Wrong label (usedM is meters, not mm)
    }
    elements.filamentLen.textContent = lengthText;
}
```

**What Was Happening**:
- .gcode files: Showed "17419.29 mm" (filamentUsedMM in millimeters) ❌ WRONG
- .3mf files: Showed "17.42 mm" (usedM is actually in meters, wrong label) ❌ WRONG

**Impact**: Users saw filament usage in millimeters instead of the standard meters unit. Should always display as meters (e.g., "17.42 m").

**Solution**: Display filament length in METERS for all file types. Convert `filamentUsedMM` from millimeters to meters.

---

## ✨ What's New in slicer-meta

### 1. New Field: `file.filaments` Array

Both `.gcode` and `.3mf` files now return a detailed `filaments` array:

```typescript
interface ParseResult {
  file?: SlicerFileMeta | null;  // Contains filaments array now
  threeMf?: {
    filaments: FilamentInfo[];    // Already existed
    // ... other fields
  } | null;
}

// SlicerFileMeta now includes:
class SlicerFileMeta {
  filaments?: FilamentInfo[];  // ✨ NEW!
  filamentType: string;         // ✅ Now correctly filtered
  // ... other fields
}

// FilamentInfo interface:
interface FilamentInfo {
  id?: string | null;      // Filament slot ID (e.g., "0", "1", "2")
  type?: string | null;    // Material type (e.g., "PLA", "PETG")
  color?: string | null;   // Hex color (e.g., "#000000")
  usedM?: string | null;   // ⚠️ METERS used (e.g., "17.42" = 17.42 meters)
  usedG?: string | null;   // Grams used (e.g., "51.95")
}
```

### 2. Fixed Field: `file.filamentType` String

Previously returned ALL configured filaments. Now returns only used filaments.

**Before Fix:**
```json
{
  "file": {
    "filamentType": "PLA;PETG;PETG;PETG"  // ❌ All configured slots
  }
}
```

**After Fix:**
```json
{
  "file": {
    "filamentType": "PLA"  // ✅ Only used filaments
  }
}
```

---

## 📊 Example Output Comparison

### For .3mf Files:

```json
{
  "slicer": { /* ... */ },
  "file": {
    "filamentType": "PLA",           // ✅ Fixed!
    "filamentUsedMM": 17419.29,      // Legacy field (millimeters)
    "filamentUsedG": 51.95,
    "filaments": [                   // ✅ NEW!
      {
        "id": "0",
        "type": "PLA",
        "color": "#000000",
        "usedM": "17.42",            // ⚠️ METERS (not mm!)
        "usedG": "51.95"
      }
    ],
    /* ... other fields ... */
  },
  "threeMf": {
    "filaments": [                   // ✅ Same format now
      {
        "id": "1",
        "type": "PLA",
        "color": "#000000",
        "usedM": "17.42",            // ⚠️ METERS (not mm!)
        "usedG": "51.95"
      }
    ],
    /* ... other fields ... */
  }
}
```

**IMPORTANT**: Both `file.filaments[].usedM` and `threeMf.filaments[].usedM` are in **METERS**. The legacy `file.filamentUsedMM` field is in millimeters for backward compatibility.

### For .gcode Files:

```json
{
  "slicer": { /* ... */ },
  "file": {
    "filamentType": "PLA",           // ✅ Fixed!
    "filamentUsedMM": 17419.29,      // Legacy field (millimeters)
    "filamentUsedG": 51.95,
    "filaments": [                   // ✅ NEW!
      {
        "id": "0",
        "type": "PLA",
        "color": "#000000",
        "usedM": "17.42",            // ⚠️ METERS (converted from mm)
        "usedG": "51.95"
      }
    ],
    /* ... other fields ... */
  },
  "threeMf": null
}
```

---

## 🔧 Integration Steps for FlashForgeUI

### Step 0: Fix Unit Display Bug (CRITICAL - DO THIS FIRST!)

**Location**: `src/ui/job-uploader/job-uploader-renderer.ts` line 491-500

**Current Buggy Code**:
```typescript
if (elements.filamentLen) {
    let lengthText = '-';
    if (data.file?.filamentUsedMM) {
        lengthText = `${data.file.filamentUsedMM.toFixed(2)} mm`;  // ❌ Shows millimeters
    } else if (data.threeMf?.filaments?.[0]?.usedM) {
        const usedM = parseFloat(data.threeMf.filaments[0].usedM);
        lengthText = `${usedM.toFixed(2)} mm`;  // ❌ Wrong label (is meters, not mm)
    }
    elements.filamentLen.textContent = lengthText;
}
```

**Fixed Code** (Display in meters only):
```typescript
if (elements.filamentLen) {
    let lengthText = '-';
    if (data.file?.filaments?.[0]?.usedM) {
        // NEW: Use file.filaments (works for both .gcode and .3mf)
        const usedM = parseFloat(data.file.filaments[0].usedM);
        lengthText = `${usedM.toFixed(2)} m`;  // ✅ Display as meters
    } else if (data.threeMf?.filaments?.[0]?.usedM) {
        // FALLBACK: Use threeMf.filaments for .3mf files
        const usedM = parseFloat(data.threeMf.filaments[0].usedM);
        lengthText = `${usedM.toFixed(2)} m`;  // ✅ Display as meters
    } else if (data.file?.filamentUsedMM) {
        // LEGACY: Convert millimeters to meters for display
        lengthText = `${(data.file.filamentUsedMM / 1000).toFixed(2)} m`;  // ✅ Convert to meters
    }
    elements.filamentLen.textContent = lengthText;
}
```

**Key Changes**:
1. Use `file.filaments[0].usedM` as primary source (already in meters)
2. For legacy `filamentUsedMM`, convert to meters by dividing by 1000
3. Always display with "m" unit, never "mm"

---

### Step 1: Update Material Matching Dialog

Locate your material matching dialog code (likely in the file upload or print preparation flow).

**Current Code (Likely):**
```typescript
// ❌ OLD: Using filamentType string (now fixed but less detailed)
const result = await parseSlicerFile(filePath);
const materials = result.file?.filamentType?.split(';') || [];
console.log(materials);  // ["PLA", "PETG", "PETG", "PETG"] - WRONG!
```

**Updated Code (Recommended):**
```typescript
// ✅ NEW: Use filaments array for detailed info
const result = await parseSlicerFile(filePath);

// For .3mf files, prefer threeMf.filaments (most accurate)
// For .gcode files, use file.filaments
const filaments = result.threeMf?.filaments || result.file?.filaments || [];

// Display material matching dialog
filaments.forEach((filament, index) => {
  console.log(`Slot ${index + 1}:`);
  console.log(`  Material: ${filament.type}`);
  console.log(`  Color: ${filament.color}`);
  console.log(`  Usage: ${filament.usedM}m (${filament.usedG}g)`);
});
```

### Step 2: Fallback Strategy (Belt and Suspenders)

For maximum compatibility, implement this fallback chain:

```typescript
function getFilamentsFromResult(result: ParseResult): FilamentInfo[] {
  // Priority 1: Use threeMf.filaments for .3mf files (most accurate)
  if (result.threeMf?.filaments && result.threeMf.filaments.length > 0) {
    return result.threeMf.filaments;
  }

  // Priority 2: Use file.filaments array (works for both .gcode and .3mf)
  if (result.file?.filaments && result.file.filaments.length > 0) {
    return result.file.filaments;
  }

  // Priority 3: Fallback to filamentType string (legacy, but now fixed)
  if (result.file?.filamentType && result.file.filamentType !== "Unknown") {
    const types = result.file.filamentType.split(';');
    return types.map((type, index) => ({
      id: index.toString(),
      type: type.trim(),
      color: null,
      usedM: result.file.filamentUsedMM ? (result.file.filamentUsedMM / 1000).toFixed(2) : null,
      usedG: result.file.filamentUsedG?.toString() || null
    }));
  }

  // No filament data available
  return [];
}
```

### Step 3: Update Material String Display

If you're displaying a material string in the UI:

```typescript
// ✅ NEW: Create display string from filaments array
const filaments = getFilamentsFromResult(result);
const materialString = filaments.map(f => f.type).join(';');
console.log(materialString);  // "PLA" - CORRECT!

// Or use the fixed filamentType string directly
const materialString = result.file?.filamentType || "Unknown";
console.log(materialString);  // "PLA" - Also CORRECT now!
```

---

## 🧪 Testing Your Integration

### Test Case 1: Single-Color Print (.3mf)

**File**: `test-file.3mf` (included in this repo)

**Expected Behavior:**
- `result.threeMf.filaments.length` should be **1**
- `result.file.filaments.length` should be **1**
- `result.file.filamentType` should be **"PLA"**
- Material dialog should show **1 material** (PLA)
- Filament length should display **"17.42 m"** (not mm)

### Test Case 2: Multi-Material Print (.3mf)

**Expected Behavior:**
- `result.threeMf.filaments` should contain **N** entries (where N = actually used materials)
- Each entry should have non-zero `usedM` and `usedG` values
- `result.file.filamentType` should be semicolon-separated list of used materials
- Filament length should display in **meters** (m)

### Test Case 3: Plain G-code File

**Expected Behavior:**
- `result.threeMf` should be **null**
- `result.file.filaments` should contain only used filaments
- `result.file.filamentType` should match the materials in `filaments` array
- Filament length should display in **meters** (m), converted from mm

---

## 🚨 Breaking Changes

**None!** This update is fully backward compatible.

- `file.filamentType` string still exists (but is now correct)
- `file.filamentUsedMM` still exists in millimeters (for backward compatibility)
- `threeMf.filaments` array unchanged
- New `file.filaments` array is optional and won't break existing code

---

## 📝 Migration Checklist

- [ ] **CRITICAL**: Fix unit display bug in `job-uploader-renderer.ts` (Step 0)
- [ ] Change filament length display from millimeters to meters
- [ ] Test filament length shows "17.42 m" (not "17419.29 mm")
- [ ] Update `@parallel-7/slicer-meta` to version 1.1.0 (or latest)
- [ ] Locate material matching dialog code
- [ ] Replace `filamentType.split(';')` with `filaments` array access
- [ ] Implement fallback strategy from Step 2
- [ ] Test with single-color prints (.3mf and .gcode)
- [ ] Test with multi-material prints
- [ ] Verify material counts are now correct
- [ ] Update any UI that displays material strings

---

## 🎯 Expected Results After Integration

### Before Integration:
- Single-color PLA print shows "PLA;PETG;PETG;PETG" (4 materials) ❌
- Filament length displays "17419.29 mm" (should be "17.42 m") ❌

### After Integration:
- Single-color PLA print shows "PLA" (1 material) ✅
- Filament length displays "17.42 m" (meters, not millimeters) ✅
- Multi-material prints show only used materials ✅
- Detailed color and usage info available ✅

---

## 💡 Best Practices

1. **Always display filament length in meters**, never millimeters
2. **Use `file.filaments` array** as your primary data source for both `.gcode` and `.3mf` files
3. **For .3mf files**, prefer `threeMf.filaments` if you need 3MF-specific metadata
4. **Check array length** before iterating to avoid empty arrays
5. **Validate filament data** exists before displaying:
   ```typescript
   if (!filaments || filaments.length === 0) {
     console.warn("No filament data available");
     return;
   }
   ```

---

## 🔗 Related Files in This Repo

- `test-file.3mf` - Test case demonstrating the bug
- `test-bug-investigation.ts` - Script showing parser output
- `examine-gcode.ts` - Script showing G-code CONFIG_BLOCK
- `examine-filament-usage.ts` - Script showing usage correlation
- `investigate-units.ts` - Script investigating unit conversion

---

## 📞 Support

If you encounter issues:
1. Check that `@parallel-7/slicer-meta` is updated to v1.1.0+
2. Verify your test file has correct structure using the investigation scripts
3. Ensure FlashForgeUI displays filament length in **meters**, not millimeters
4. Open an issue at https://github.com/Parallel-7/slicer-meta/issues

---

## 📜 License

This integration guide and all code examples are provided under the same license as the slicer-meta package.

---

**Last Updated**: 2025-11-12
**slicer-meta Version**: 1.1.0
**Author**: Claude (Anthropic AI Assistant)
