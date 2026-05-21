export const GamePlatform = {
  name: "web",
  isMetaInstant: false,
  entryPointData: null,
  setLoadingProgress(progress) {
    const fb = window.FBInstant;
    if (fb && typeof fb.setLoadingProgress === "function") {
      fb.setLoadingProgress(Math.round(progress));
    }
  },
  quit() {
    const fb = window.FBInstant;
    if (fb && typeof fb.quit === "function") {
      fb.quit();
    }
  },
};

export async function initializePlatform() {
  const fb = window.FBInstant;

  if (!fb) {
    return GamePlatform;
  }

  GamePlatform.name = "meta-instant-games";
  GamePlatform.isMetaInstant = true;

  try {
    await fb.initializeAsync();
    GamePlatform.setLoadingProgress(65);
    await fb.startGameAsync();
    GamePlatform.entryPointData =
      typeof fb.getEntryPointData === "function" ? fb.getEntryPointData() : null;
  } catch (error) {
    console.warn("Meta Instant Games initialization failed, continuing locally.", error);
  }

  return GamePlatform;
}
