import { Button } from "@/components/ui/button";

export const DownloadLinks = () => {
  return (
    <div className="flex gap-4">
      <Button asChild size="sm">
        <a
          href="https://do27d9uxrn.ufs.sh/f/g7YqjDR3JjGdeyuD00EQEbWPH7RjywZVxvah1SAIzFmoOQ6u"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download for Chrome
        </a>
      </Button>
      <Button asChild size="sm">
        <a
          href="https://do27d9uxrn.ufs.sh/f/g7YqjDR3JjGd0Z25yMpUe8l3UcFKBLJhPgz7dupntVkqYSQ6"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download for Firefox
        </a>
      </Button>
    </div>
  );
};

export default DownloadLinks;
