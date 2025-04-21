const completions = {
  create: jest.fn(async () => ({ data: { choices: [{ text: 'mocked completion' }] } })),
};

const chat = {
  completions: {
    create: jest.fn(async () => ({ choices: [{ message: { content: 'mocked response' } }] }))
  }
};

function OpenAI() {
  return {
    chat,
    completions,
    createChatCompletion: jest.fn(async () => ({ data: { choices: [{ message: { content: 'mocked response' } }] } })),
    createCompletion: jest.fn(async () => ({ data: { choices: [{ text: 'mocked response' }] } })),
  };
}

OpenAI.chat = chat;
OpenAI.completions = completions;
OpenAI.createChatCompletion = jest.fn(async () => ({ data: { choices: [{ message: { content: 'mocked response' } }] } }));
OpenAI.createCompletion = jest.fn(async () => ({ data: { choices: [{ text: 'mocked response' }] } }));

module.exports = OpenAI;
