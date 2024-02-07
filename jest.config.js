module.exports = {
    preset: 'react-native',
    // setupFilesAfterEnv: ['@testing-library/react-native/cleanup-after-each'],
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    "transformIgnorePatterns": [
        "node_modules/(?!(@react-native|react-native|react-native-iphone-x-helper|expo-sqlite|expo-modules-core)/)",
    ],
};
