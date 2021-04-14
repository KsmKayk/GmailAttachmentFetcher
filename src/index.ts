import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import readline from "readline-sync";

puppeteer.use(StealthPlugin());

interface User {
  email: string;
  password: string;
}

interface Email {
  title: string;
  attachments: Attachment[];
}

interface Attachment {
  name: string;
  url: string;
}

async function start() {
  const { email, password } = askUserAndPassword();

  const page = await startPuppeteer();
  await LoginGmail({ email, password }, gmailUrl, page);
  const emailsIds = await getEmailsWithAttachmentsIds(page);
  const emailsWithAttachments = await fetchEmailTitleAndAttachments(
    emailsIds,
    page
  );
  // let emails = await pagination(page, emailsWithAttachments, emailsIds);
  showEmails(emailsWithAttachments);
}

const gmailUrl =
  "https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&service=mail&sacu=1&rip=1&flowName=GlifWebSignIn&flowEntry=ServiceLogin";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function askUserAndPassword(): User {
  let user: User = {
    email: "",
    password: "",
  };

  user.email = readline.question("Type your email (Gmail): ");
  user.password = readline.question("Now, type your password: ");

  return user;
}

async function startPuppeteer(): Promise<Page> {
  const browser = await puppeteer.launch({
    headless: false,
  });
  return await browser.newPage();
}

async function LoginGmail(
  { email, password }: User,
  gmailUrl: string,
  page: Page
) {
  const navigationPromise = page.waitForNavigation();

  const inputSelector = ".whsOnd";
  const signinButtonSelector = ".VfPpkd-RLmnJb";
  const gmailInitialPageConfirmator = ".aAy.J-KU-KO.aIf-aLe";

  await page.goto(gmailUrl, {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector(inputSelector);
  await page.type(inputSelector, email, { delay: 100 });
  await page.click(signinButtonSelector);

  await navigationPromise;
  await delay(2000);

  await page.waitForSelector(inputSelector);
  await page.type(inputSelector, password, { delay: 100 });
  await page.click(signinButtonSelector);

  await navigationPromise;
  await delay(3000);

  await page.waitForSelector(gmailInitialPageConfirmator);
}

async function getEmailsWithAttachmentsIds(page: Page): Promise<string[]> {
  const emailsSelector =
    "div div.nH div.nH.bkL div.no div.nH.bkK.nn div.nH div.nH div.nH.ar4.z div div.AO div.Tm.aeJ div.aeF div.nH div.BltHke.nH.oy8Mbf.aE3 div.UI div.aDP div.ae4.aDM.nH.oy8Mbf div.Cp div table.F.cf.zt tbody tr";

  let emailsWithAttachmentsElementsIds = await page.evaluate(() => {
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
  return emailsWithAttachmentsElementsIds;
}

async function fetchEmailTitleAndAttachments(
  emailsIds: string[],
  page: Page
): Promise<Email[]> {
  let i = 0;
  const navigationPromise = page.waitForNavigation();
  let emails = [];

  let backButtonSelector = "div.T-I.J-J5-Ji.lS.T-I-ax7.mA";

  while (i < emailsIds.length) {
    await page.click(`[id="${emailsIds[i]}"]`);
    await navigationPromise;
    await delay(2000);
    let email = await page.evaluate(() => {
      let email: Email = {
        title: "",
        attachments: [],
      };

      let titleElement = document.querySelector(
        "div div.nH div.nH.bkL div.no div.nH.bkK.nn div.nH div.nH div.nH.ar4.z div div.AO div.Tm.aeJ div.aeF div.nH div.nH div.nH.g.id table.Bs.nH.iY.bAt tr td.Bu.bAn div.nH.if div.nH.V8djrc.byY div.nH div.ha h2.hP"
      );
      email.title = titleElement.innerHTML;

      let attachmentsElements = document.querySelectorAll("span.aZo.N5jrZb");

      let i2 = 0;
      while (i2 < attachmentsElements.length) {
        let attachment: Attachment = {
          name: "",
          url: "",
        };
        attachment.url = attachmentsElements[i2].children[0].getAttribute(
          "href"
        );
        attachment.name =
          attachmentsElements[
            i2
          ].children[0].children[1].children[2].children[2].children[1].children[0].children[0].children[0].innerHTML;
        email.attachments.push(attachment);
        i2 = i2 + 1;
      }

      return email;
    });
    emails.push(email);
    await page.click(backButtonSelector);
    await navigationPromise;
    await delay(2000);
    i++;
  }
  return emails;
}

// async function pagination(
//   page: Page,
//   emails: Email[],
//   emailsIds: string[]
// ): Promise<Email[]> {
//   if (emailsIds.length >= 3) {
//     return emails;
//   } else {
//     const navigationPromise = page.waitForNavigation();
//     const nextButtonSelector =
//       "div.T-I.J-J5-Ji.amD.T-I-awG.T-I-ax7.T-I-Js-Gs.L3";
//     page.click(nextButtonSelector);
//     navigationPromise;
//     delay(3000);
//     let nextPageEmailsIds = await getEmailsWithAttachmentsIds(page);
//     if (
//       nextPageEmailsIds.length == 0 ||
//       nextPageEmailsIds.length == null ||
//       nextPageEmailsIds.length == undefined
//     ) {
//       await pagination(page, emails, emailsIds);
//     }
//     if (
//       nextPageEmailsIds.length > 0 &&
//       nextPageEmailsIds.length + emailsIds.length < 3
//     ) {
//       let nextPageEmails = await fetchEmailTitleAndAttachments(
//         nextPageEmailsIds,
//         page
//       );
//       nextPageEmails.map((data, idx) => {
//         emails.push(data);
//       });
//       await pagination(page, emails, emailsIds);
//     }
//     if (
//       nextPageEmailsIds.length > 0 &&
//       nextPageEmailsIds.length + emailsIds.length >= 3
//     ) {
//       let nextPageEmails = await fetchEmailTitleAndAttachments(
//         nextPageEmailsIds,
//         page
//       );
//       nextPageEmails.map((data, idx) => {
//         emails.push(data);
//       });

//       return emails;
//     }
//   }
// }

function showEmails(emails: Email[]) {
  emails.map((data, idx) => {
    if (idx <= 2) {
      console.log(data);
    }
  });
}

start();
