# Vitest Basics

See the official documentation at https://vitest.dev/api/.

Basic syntax:

-   Make sure your test file ends with `.test.ts` (or .js for JavaScript).
    If you're testing `foo.ts`, you'd probably name the test file `foo.test.ts`.
-   Use the `describe` function to organize tests into groups
-   Use the `test` function to write individual tests
-   Within each test, use `expect` to provide an assertion.
    Ideally, each test should have one call to `expect`

Here's what a test suite generally looks like:

```js
describe('double function', () => {
    test('doubles positive number', () => {
        const result = foo(5);
        expect(result).toBe(10);
    });

    test('doubles negative number', () => {
        const result = foo(-7);
        expect(result).toBe(-14);
    });
});
```

Gotchas:

-   Make sure you import `describe`, `test`, and `expect` from vitest, not from node.test.
-   If you call an asynchronous function in `expect`, use `.resolves` or `.rejects` to get the
    result (see https://vitest.dev/api/expect.html#resolves)

# Running Tests

Run `node test` in a terminal window to run all the tests in the project. As long as you keep
this window open, the test results will update every time you save a source file, giving you
instant feedback about whether your tests are passing. If I have two monitors, I like to keep
VSCode open in one and vitest open in the other.

# Test-Driven Development

As a side note, I like to practice test-driven development (TDD). In TDD, you write code
in short, iterative cycles following these three steps:

-   Write a failing test that describes what your code should do
-   Write just enough code to pass the test
-   Refactor if necessary

Here are two articles about TDD if you're interested in learning more:

-   Short article: https://dev.to/mungaben/the-tdd-cycle-red-green-refactor-1aaf
-   Very good article: https://blog.cleancoder.com/uncle-bob/2014/12/17/TheCyclesOfTDD.html

# Creating Mocks

Vitest supports a feature called mocking. Mocking allows you to override the implementation of
a function or method for testing purposes. This is occasionally helpful in two situations:

-   You want to verify that your function calls another function
-   Your function calls a function to do something that shouldn't be done in a test (ex: log a message to Firebase)

You can read more about mocking in the Vitest documentation: https://vitest.dev/guide/mocking.html

Although mocking is sometimes helpful, I would recommend using it as little as possible. There are often other
ways to write your code to make it more testable. At the end of the summer, I saw my tests improve dramatically when
I moved away from mocking and used the polymorphism technique below.

# Polymorphism is your friend

Suppose a function `foo` is supposed to log a message to Firebase. Here's how you can use polymorphism
to test this functionality:

in `foo.ts`:

```ts
class ErrorLogger {
    logError(message: string) {
        // TODO
        console.log(message);
    }
}

export function foo(x: number, logger: ErrorLogger) {
    if (x < 0) {
        logger.logError('x should not be negative');
    }
}

// In production, call `foo` like this:
const logger = new ErrorLogger();
foo(10, logger);
```

in `foo.test.ts`:

```ts
class TestErrorLogger extends ErrorLogger {
    lastMessage: string;

    logError(message: string) {
        this.lastMessage = message;
    }
}

describe('foo', () => {
    test('Logs error on negative input', () => {
        const logger = new TestErrorLogger();
        foo(-1, logger);

        // foo should log an error about being called with a negative number
        expect(logger.lastMessage).toContain('negative');
    });
});
```
