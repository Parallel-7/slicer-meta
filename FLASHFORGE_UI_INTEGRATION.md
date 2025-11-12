# FlashForgeUI Integration Guide: slicer-meta v1.1.0

## 📋 Summary

This document describes changes made to `@parallel-7/slicer-meta` to fix the filament filtering bug and provides integration guidance for FlashForgeUI-Electron.

---

## 🐛 Bug Fixed

**Issue**: Material matching dialog displayed "PLA;PETG;PETG;PETG" (4 materials) for a single-color PLA print.

**Root Cause**: The parser was returning ALL configured filament slots instead of filtering to show only filaments actually used in the print.

**Solution**: Enhanced parser to correlate filament type with usage data and filter out unused filaments.

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
  usedM?: string | null;   // Meters used (e.g., "17419.29")
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
    "filamentUsedMM": 17419.29,
    "filamentUsedG": 51.95,
    "filaments": [                   // ✅ NEW!
      {
        "id": "0",
        "type": "PLA",
        "color": "#000000",
        "usedM": "17419.29",
        "usedG": "51.95"
      }
    ],
    /* ... other fields ... */
  },
  "threeMf": {
    "filaments": [                   // ✅ Same data
      {
        "id": "1",
        "type": "PLA",
        "color": "#000000",
        "usedM": "17.42",
        "usedG": "51.95"
      }
    ],
    /* ... other fields ... */
  }
}
```

### For .gcode Files:

```json
{
  "slicer": { /* ... */ },
  "file": {
    "filamentType": "PLA",           // ✅ Fixed!
    "filamentUsedMM": 17419.29,
    "filamentUsedG": 51.95,
    "filaments": [                   // ✅ NEW!
      {
        "id": "0",
        "type": "PLA",
        "color": "#000000",
        "usedM": "17419.29",
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
      usedM: result.file.filamentUsedMM?.toString(),
      usedG: result.file.filamentUsedG?.toString()
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

### Test Case 2: Multi-Material Print (.3mf)

**Expected Behavior:**
- `result.threeMf.filaments` should contain **N** entries (where N = actually used materials)
- Each entry should have non-zero `usedM` and `usedG` values
- `result.file.filamentType` should be semicolon-separated list of used materials

### Test Case 3: Plain G-code File

**Expected Behavior:**
- `result.threeMf` should be **null**
- `result.file.filaments` should contain only used filaments
- `result.file.filamentType` should match the materials in `filaments` array

---

## 🚨 Breaking Changes

**None!** This update is fully backward compatible.

- `file.filamentType` string still exists (but is now correct)
- `threeMf.filaments` array unchanged
- New `file.filaments` array is optional and won't break existing code

---

## 📝 Migration Checklist

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

### After Integration:
- Single-color PLA print shows "PLA" (1 material) ✅
- Multi-material prints show only used materials ✅
- Detailed color and usage info available ✅

---

## 💡 Best Practices

1. **Always use `file.filaments` array** as your primary data source for both `.gcode` and `.3mf` files
2. **For .3mf files**, prefer `threeMf.filaments` if you need 3MF-specific metadata
3. **Check array length** before iterating to avoid empty arrays
4. **Validate filament data** exists before displaying:
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

---

## 📞 Support

If you encounter issues:
1. Check that `@parallel-7/slicer-meta` is updated to v1.1.0+
2. Verify your test file has correct structure using the investigation scripts
3. Open an issue at https://github.com/Parallel-7/slicer-meta/issues

---

## 📜 License

This integration guide and all code examples are provided under the same license as the slicer-meta package.

---

**Last Updated**: 2025-11-12
**slicer-meta Version**: 1.1.0
**Author**: Claude (Anthropic AI Assistant)
