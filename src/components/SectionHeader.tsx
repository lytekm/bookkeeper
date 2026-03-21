import type { ReactNode } from "react";
import styles from "../app/page.module.css";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export const SectionHeader = ({ title, description, action }: Props) => (
  <div className={styles.sectionHeader}>
    <div>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
    {action ? <div className={styles.sectionAction}>{action}</div> : null}
  </div>
);
