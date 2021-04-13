import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import readline from "readline-sync";

puppeteer.use(StealthPlugin());

interface User {
  email: string;
  password: string;
}

async function start() {
  //const { email, password } = askUserAndPassword();
  let user = {
    email: "ksm.kayk@gmail.com",
    password: "eugostodejogar",
  };
  loginGmailAndFetchAttachments(user);
}

function askUserAndPassword(): User {
  let user: User = {
    email: "",
    password: "",
  };

  user.email = readline.question("Type your email (Gmail): ");
  user.password = readline.question("Now, type your password: ");

  return user;
}

async function loginGmailAndFetchAttachments({ email, password }: User) {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const baseUrl =
    "https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&service=mail&sacu=1&rip=1&flowName=GlifWebSignIn&flowEntry=ServiceLogin";

  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto(baseUrl, {
    waitUntil: "networkidle2",
  });
  const navigationPromise = page.waitForNavigation();

  await page.waitForSelector(".whsOnd");
  await page.type(".whsOnd", email, { delay: 100 });
  await page.click(".VfPpkd-RLmnJb");

  await navigationPromise;
  await delay(1000);

  await page.waitForSelector(".whsOnd");
  await page.type(".whsOnd", password, { delay: 100 });
  await page.click(".VfPpkd-RLmnJb");

  await navigationPromise;
  await delay(3000);

  await page.waitForSelector(".aAy.J-KU-KO.aIf-aLe");
  let emailsWithAttachmentsIDs = await page.evaluate(() => {
    let emails = Array.from(
      document.querySelectorAll(
        "div div.nH div.nH.bkL div.no div.nH.bkK.nn div.nH div.nH div.nH.ar4.z div div.AO div.Tm.aeJ div.aeF div.nH div.BltHke.nH.oy8Mbf.aE3 div.UI div.aDP div.ae4.aDM.nH.oy8Mbf div.Cp div table.F.cf.zt tbody tr"
      )
    );

    let emailWithAttachments = emails.map((data, idx) => {
      if (data.getElementsByClassName("yE").length > 0) {
        return data;
      }
    });

    let filtered = emailWithAttachments.filter(function (el) {
      return el != null && el != undefined;
    });

    let emailsIds = filtered.map((data, idx) => {
      return data.getAttribute("id");
    });

    return emailsIds;
  });

  let emailsArray = emailsWithAttachmentsIDs.map(async (data, idx) => {
    await page.click(`#${data}`);
    await navigationPromise;
    let email = await page.evaluate(() => {
      let email = {
        title: "",
        attachments: [""],
      };
      let titleElement = document.querySelector(
        "div div.nH div.nH.bkL div.no div.nH.bkK.nn div.nH div.nH div.nH.ar4.z div div.AO div.Tm.aeJ div.aeF div.nH div.nH div.nH.g.id table.Bs.nH.iY.bAt tr td.Bu.bAn div.nH.if div.nH.V8djrc.byY div.nH div.ha h2.hP"
      );
      email.title = titleElement.innerHTML;
      console.log(email);
    });
  });
  console.log(emailsArray);
}

start();
