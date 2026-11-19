// The Android app. Build from the repository root with scripts/build_apk.sh, which first copies site/ into assets/.
plugins {
    id("com.android.application") version "8.13.0"
    id("org.jetbrains.kotlin.android") version "2.2.20"
}

fun prop(name: String): String? = (project.findProperty(name) as String?) ?: System.getenv(name)

android {
    namespace = "org.hcc.history"
    compileSdk = 36

    defaultConfig {
        applicationId = "org.hcc.history"
        minSdk = 24
        targetSdk = 36
        versionCode = prop("VERSION_CODE")?.toInt() ?: 1800
        versionName = prop("VERSION_NAME") ?: "18.0"
        // where the optional study packs and app updates come from (the GitHub Pages web app and GitHub releases)
        buildConfigField("String", "PACK_BASE", "\"${prop("PACK_BASE") ?: "https://rapha1232.github.io/church_history/"}\"")
        buildConfigField("String", "RELEASES_API", "\"${prop("RELEASES_API") ?: "https://api.github.com/repos/rapha1232/church_history/releases/latest"}\"")
    }

    sourceSets["main"].apply {
        manifest.srcFile("AndroidManifest.xml")
        java.srcDirs("src")
        res.srcDirs("res")
        assets.srcDirs("assets")
    }
    sourceSets["test"].java.srcDirs("test")

    signingConfigs {
        create("release") {
            val ks = prop("KEYSTORE")
            if (ks != null) {
                storeFile = file(ks)
                storePassword = prop("KEYSTORE_PASS")
                keyAlias = prop("KEY_ALIAS") ?: "hcc"
                keyPassword = prop("KEYSTORE_PASS")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (prop("KEYSTORE") != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures { buildConfig = true }
    androidResources { noCompress += listOf("webp", "woff2", "json") }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
    bundle {
        // one APK per language would hide the app's own language picker: keep every language in every install
        language { enableSplit = false }
    }
}

kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }

dependencies {
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}
