export const IDENTITY_BOOST_INSTRUCTION = `

IMPORTANT: Preserve the exact facial identity, features, skin tone, hair color, hair style, eye color, body type and overall appearance of the person shown in the reference image(s). The generated image MUST look like the SAME PERSON from the reference photos — same face, same identity, same age. Do not alter, beautify, or modify the person's natural features. Only change the pose, outfit, environment and styling as described in the prompt above, while keeping the person's identity 100% recognizable and faithful to the reference.`;

export function applyIdentityBoost(prompt: string): string {
  return prompt + IDENTITY_BOOST_INSTRUCTION;
}
