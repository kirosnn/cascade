import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { testRender } from "../src/test-utils"

let testSetup: Awaited<ReturnType<typeof testRender>>

describe("Link Rendering Tests", () => {
  beforeEach(async () => {
    if (testSetup) {
      testSetup.renderer.destroy()
    }
  })

  afterEach(() => {
    if (testSetup) {
      testSetup.renderer.destroy()
    }
  })

  test("should render link with href correctly", async () => {
    testSetup = await testRender(
      <text>
        Visit <a href="https://cascadetui.vercel.app">cascadetui.vercel.app</a> for more info
      </text>,
      {
        width: 50,
        height: 5,
      },
    )

    await testSetup.renderOnce()
    const frame = testSetup.captureCharFrame()

    expect(frame).toContain("Visit cascadetui.vercel.app for more info")
  })

  test("should render styled link with underline", async () => {
    testSetup = await testRender(
      <text>
        <u>
          <a href="https://cascadetui.vercel.app" fg="blue">
            cascadetui.vercel.app
          </a>
        </u>
      </text>,
      {
        width: 50,
        height: 5,
      },
    )

    await testSetup.renderOnce()
    const frame = testSetup.captureCharFrame()

    expect(frame).toContain("cascadetui.vercel.app")
  })

  test("should render link inside text with other elements", async () => {
    testSetup = await testRender(
      <text>
        Check out <a href="https://github.com/kirosnn/cascade">GitHub</a> and{" "}
        <a href="https://cascadetui.vercel.app">our website</a>
      </text>,
      {
        width: 60,
        height: 5,
      },
    )

    await testSetup.renderOnce()
    const frame = testSetup.captureCharFrame()

    expect(frame).toContain("GitHub")
    expect(frame).toContain("our website")
  })
})
