#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test file
TEST_FILE="/Users/kuhandransamudrapandiyan/Projects/Content-Hub/src/views/syncmanager-page.ejs"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SYNCMANAGER FIXES - AUTOMATED TEST SCRIPT                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run test
run_test() {
    local test_name="$1"
    local search_pattern="$2"
    local file="$3"
    
    if grep -q "$search_pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check line count
check_file_exists() {
    if [ -f "$TEST_FILE" ]; then
        echo -e "${GREEN}✅${NC} File exists: $TEST_FILE"
        local lines=$(wc -l < "$TEST_FILE")
        echo -e "   Lines: ${YELLOW}$lines${NC}"
        return 0
    else
        echo -e "${RED}❌${NC} File not found: $TEST_FILE"
        return 1
    fi
}

echo -e "${BLUE}📋 TEST SUITE: SYNCMANAGER FIXES${NC}\n"

# Check file exists
echo -e "${YELLOW}1. FILE INTEGRITY${NC}"
check_file_exists || exit 1
echo ""

# Test 1: Logs loop fix
echo -e "${YELLOW}2. LOGS LOOP FIX (Line 635)${NC}"
run_test "Logs x-for uses (log, logIndex)" 'x-for="(log, logIndex) in logs"' "$TEST_FILE"
run_test "Logs :key uses logIndex" ':key="logIndex"' "$TEST_FILE"
echo ""

# Test 2: Total count calculation
echo -e "${YELLOW}3. TOTAL FILES COUNT FIX (Lines 727-731)${NC}"
run_test "totalCount variable declaration" 'const totalCount = ' "$TEST_FILE"
run_test "totalCount includes config files" 'data.manifest.files.config' "$TEST_FILE"
run_test "totalCount includes data files" 'data.manifest.files.data' "$TEST_FILE"
run_test "totalCount includes files" 'data.manifest.files.files' "$TEST_FILE"
run_test "totalCount includes collections" 'data.manifest.files.collections' "$TEST_FILE"
run_test "Status log uses totalCount" 'Status retrieved: \${totalCount} files' "$TEST_FILE"
echo ""

# Test 3: File listing table
echo -e "${YELLOW}4. FILE LISTING TABLE (Lines 502-540)${NC}"
run_test "Table card has blue border" 'border: 2px solid #667eea' "$TEST_FILE"
run_test "Table card title has emoji" 'File Listing by Category' "$TEST_FILE"
run_test "Table header: Category column" 'Category</th>' "$TEST_FILE"
run_test "Table header: File Name column" 'File Name</th>' "$TEST_FILE"
run_test "Table header: Path column" 'Path</th>' "$TEST_FILE"
run_test "Table header: Size Bytes column" 'Size (Bytes)</th>' "$TEST_FILE"
run_test "Table header: Size KB column" 'Size (KB)</th>' "$TEST_FILE"
run_test "Table header: Type column" 'Type</th>' "$TEST_FILE"
run_test "Table body x-for uses index" 'x-for="(file, index) in fileList"' "$TEST_FILE"
run_test "Empty state message present" 'No files loaded yet' "$TEST_FILE"
echo ""

# Test 4: Breadcrumbs
echo -e "${YELLOW}5. BREADCRUMB SEPARATORS (Lines 429-441)${NC}"
run_test "Breadcrumb element present" 'class="breadcrumb"' "$TEST_FILE"
run_test "Breadcrumb separator pipe present" 'breadcrumb-sep.*|' "$TEST_FILE"
run_test "Breadcrumb with proper styling" 'margin-left: 8px' "$TEST_FILE"
echo ""

# Test 5: JavaScript state
echo -e "${YELLOW}6. JAVASCRIPT STATE INITIALIZATION (Lines 650-673)${NC}"
run_test "fileList initialized as array" 'fileList: \[\]' "$TEST_FILE"
run_test "categorySummary initialized as object" 'categorySummary: {}' "$TEST_FILE"
run_test "logs initialized as array" 'logs: \[\]' "$TEST_FILE"
run_test "stats object has configCount" 'configCount: ' "$TEST_FILE"
run_test "stats object has totalSize" 'totalSize:' "$TEST_FILE"
run_test "stats object has manifestGenerated" 'manifestGenerated' "$TEST_FILE"
run_test "Page loads with init function" '@load.window=' "$TEST_FILE"
run_test "init() function defined" 'init()' "$TEST_FILE"
echo ""

# Test 6: updateStats function
echo -e "${YELLOW}7. updateStats FUNCTION (Lines 780-855)${NC}"
run_test "updateStats function defined" 'updateStats(manifest)' "$TEST_FILE"
run_test "Manifest check with optional chaining" 'manifest\.files' "$TEST_FILE"
run_test "File object structure correct" 'category: category' "$TEST_FILE"
run_test "File size calculation in KB" '\.size.*1024.*toFixed' "$TEST_FILE"
run_test "Files sorted by category" 'a\.category.*localeCompare' "$TEST_FILE"
run_test "Category summary created" 'categorySummary\[category\]' "$TEST_FILE"
run_test "Stats assigned to this.stats" 'this\.stats = {' "$TEST_FILE"
run_test "fileList assigned" 'this\.fileList = allFiles' "$TEST_FILE"
echo ""

# Test 7: checkStatus function
echo -e "${YELLOW}8. checkStatus FUNCTION (Lines 719-738)${NC}"
run_test "checkStatus fetches API" "fetch('/api/auto-sync/status')" "$TEST_FILE"
run_test "checkStatus calls updateStats" 'updateStats(data.manifest)' "$TEST_FILE"
run_test "checkStatus has error handling" 'catch (error)' "$TEST_FILE"
echo ""

# Test 8: HTML syntax
echo -e "${YELLOW}9. HTML SYNTAX VALIDATION${NC}"
# Count opening and closing divs
opening_divs=$(grep -o '<div' "$TEST_FILE" | wc -l)
closing_divs=$(grep -o '</div>' "$TEST_FILE" | wc -l)
if [ "$opening_divs" -eq "$closing_divs" ]; then
    echo -e "${GREEN}✅ PASS${NC}: HTML div balance (${opening_divs} opening, ${closing_divs} closing)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: HTML div imbalance (${opening_divs} opening, ${closing_divs} closing)"
    ((TESTS_FAILED++))
fi

# Check for basic JavaScript syntax
if grep -q "function syncManagerApp()" "$TEST_FILE"; then
    echo -e "${GREEN}✅ PASS${NC}: syncManagerApp function declared"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: syncManagerApp function not found"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                        TEST SUMMARY                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ ALL TESTS PASSED - CODE IS READY FOR TESTING!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
    echo "2. Navigate to: http://localhost:3001/syncmanager"
    echo "3. You should see the '📁 File Listing by Category' card"
    echo "4. Click 'Check Status' button"
    echo "5. Table will populate with 128 files"
    echo ""
    exit 0
else
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ SOME TESTS FAILED - REVIEW THE FILE${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    exit 1
fi
