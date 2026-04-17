# Course Delete Fix ✅ COMPLETE

**Changes applied:**
- Single delete now permanent using `hardDeleteByIds([id])`
- Dialog: "Delete Course" | "Permanently delete this course? This cannot be undone."
- Toast: "Course deleted permanently"

**Test:** Create course → Trash button → Confirm → Gone from list/localStorage (check devtools → Application → localStorage → studyos_courses).

Course page delete now permanently removes courses instead of archiving.
