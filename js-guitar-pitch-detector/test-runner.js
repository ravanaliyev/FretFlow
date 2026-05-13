// Minimal test framework for browser - no dependencies

const results = [];
let currentDescribe = '';

function describe(name, fn) {
    currentDescribe = name;
    console.group(`  ${name}`);
    fn();
    console.groupEnd();
}

function it(description, fn) {
    try {
        fn();
        console.log(`    ✓ ${description}`);
        results.push({ name: description, passed: true, suite: currentDescribe });
    } catch (e) {
        console.error(`    ✗ ${description}`, e.message);
        results.push({ name: description, passed: false, suite: currentDescribe, error: e.message });
    }
}

function assertEquals(actual, expected, tolerance = 1, message = '') {
    const absDiff = Math.abs(actual - expected);
    if (absDiff > tolerance) {
        throw new Error(`${message}Expected ${expected}±${tolerance}, got ${actual} (diff: ${absDiff.toFixed(2)})`);
    }
}

function assertApprox(actual, expected, tolerance = 0.05, message = '') {
    const ratio = actual / expected;
    if (ratio < 1 - tolerance || ratio > 1 + tolerance) {
        throw new Error(`${message}Expected ratio ${expected}, got ${actual} (ratio: ${ratio.toFixed(3)})`);
    }
}

function printSummary() {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log('\n========================================');
    console.log(`  Tests: ${passed} passed, ${failed} failed`);
    console.log('========================================\n');
    return { passed, failed, results };
}

function getResults() {
    return results;
}

function clearResults() {
    results.length = 0;
}